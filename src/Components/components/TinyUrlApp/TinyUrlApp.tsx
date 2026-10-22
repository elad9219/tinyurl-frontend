
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { format, isValid, parse } from 'date-fns';
import axiosInstance from '../../../utils/axiosInstance';
import globals from '../../../utils/globals';
import './TinyUrlApp.css';

interface ShortUrl {
    clicks?: { [month: string]: number };
    longUrl?: string;
}

interface UserInfo {
    name: string;
    allUrlClicks: number;
    shorts: { [code: string]: ShortUrl } | null;
}

interface ClickEntry {
    clickTime: string;
    tiny: string;
    longUrl: string;
}

type ServerStatus = 'checking' | 'ready' | 'error';
type NoticeKind = 'success' | 'error' | 'info';

interface Notice {
    text: string;
    kind: NoticeKind;
}

const WAKE_TIMEOUT_MS = 120000;

function isClickEntry(value: unknown): value is ClickEntry {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const item = value as Partial<ClickEntry>;

    return typeof item.clickTime === 'string'
        && typeof item.tiny === 'string'
        && typeof item.longUrl === 'string';
}

function errorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data: unknown = error.response?.data;

        if (status === 409) {
            return 'User already exists.';
        }

        if (status === 404) {
            if (typeof data === 'string') {
                const message = data.trim();

                if (
                    message.length > 0 &&
                    message.length < 250 &&
                    !/<html/i.test(message)
                ) {
                    return message;
                }
            }

            return 'User not found.';
        }

        if (status === 502 || status === 503 || status === 504) {
            return 'The server is temporarily unavailable. Please try again shortly.';
        }

        if (!error.response || error.code === 'ECONNABORTED') {
            return 'Could not reach the server. Please try again.';
        }

        if (
            typeof data === 'string' &&
            data.trim().length > 0 &&
            data.length < 250 &&
            !/<html/i.test(data)
        ) {
            return data.trim();
        }

        if (data && typeof data === 'object' && 'message' in data) {
            const message = (data as { message?: unknown }).message;

            if (
                typeof message === 'string' &&
                message.trim().length > 0 &&
                message.length < 250
            ) {
                return message.trim();
            }
        }
    }

    return fallback;
}

function formatClickDate(value: string): string {
    const parsed = parse(value, 'yyyy-MM-dd HH:mm:ss', new Date());

    return isValid(parsed)
        ? format(parsed, "dd/MM/yyyy 'at' HH:mm:ss")
        : value;
}

// Check MongoDB user existence before requesting click history.
// HTTP 404 is an expected result for a missing user.
async function findUser(name: string): Promise<UserInfo | null> {
    const response = await axiosInstance.get<UserInfo>(
        globals.api.userInfo(name),
        {
            validateStatus: (status) =>
                (status >= 200 && status < 300) || status === 404,
        }
    );

    if (response.status === 404) {
        return null;
    }

    if (
        response.status !== 200 ||
        !response.data ||
        typeof response.data.name !== 'string'
    ) {
        throw new Error('Unexpected user response');
    }

    return response.data;
}

const TinyUrlApp: React.FC = () => {
    const [username, setUsername] = useState('');
    const [longUrl, setLongUrl] = useState('');
    const [tinyUrl, setTinyUrl] = useState('');

    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [clicks, setClicks] = useState<ClickEntry[]>([]);

    const [createUserNotice, setCreateUserNotice] = useState<Notice | null>(null);
    const [createTinyNotice, setCreateTinyNotice] = useState<Notice | null>(null);
    const [userInfoNotice, setUserInfoNotice] = useState<Notice | null>(null);
    const [clicksNotice, setClicksNotice] = useState<Notice | null>(null);

    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [isCreatingTiny, setIsCreatingTiny] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(false);
    const [isLoadingClicks, setIsLoadingClicks] = useState(false);

    const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');
    const [wakeRequest, setWakeRequest] = useState(0);
    const [showHelp, setShowHelp] = useState(false);
    const [copyMessage, setCopyMessage] = useState('');

    const usernameVersion = useRef(0);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        const startedAt = Date.now();

        const wakeServer = async () => {
            setServerStatus('checking');

            while (active && Date.now() - startedAt < WAKE_TIMEOUT_MS) {
                try {
                    const response = await axios.get(globals.api.health, {
                        timeout: 12000,
                        signal: controller.signal,
                        headers: { Accept: 'application/json' },
                    });

                    if (
                        response.status === 200 &&
                        response.data?.swagger === '2.0'
                    ) {
                        if (active) {
                            setServerStatus('ready');
                        }

                        return;
                    }
                } catch (error) {
                    if (controller.signal.aborted) {
                        return;
                    }
                }

                await new Promise<void>((resolve) => {
                    setTimeout(resolve, 4000);
                });
            }

            if (active) {
                setServerStatus('error');
            }
        };

        void wakeServer();

        return () => {
            active = false;
            controller.abort();
        };
    }, [wakeRequest]);

    const updateUsername = (value: string) => {
        usernameVersion.current += 1;

        setUsername(value);
        setUserInfo(null);
        setClicks([]);
        setTinyUrl('');
        setCopyMessage('');

        setCreateUserNotice(null);
        setCreateTinyNotice(null);
        setUserInfoNotice(null);
        setClicksNotice(null);
    };

    const handleCreateUser = async () => {
        const name = username.trim();

        if (!name) {
            setCreateUserNotice({
                text: 'Please enter a username.',
                kind: 'error',
            });
            return;
        }

        if (isCreatingUser) return;

        const version = usernameVersion.current;

        setIsCreatingUser(true);
        setCreateUserNotice(null);

        try {
            await axiosInstance.post(globals.api.user, null, {
                params: { name },
            });

            if (version === usernameVersion.current) {
                setCreateUserNotice({
                    text: 'User created successfully.',
                    kind: 'success',
                });
            }
        } catch (error) {
            if (version === usernameVersion.current) {
                setCreateUserNotice({
                    text: errorMessage(
                        error,
                        'Unable to create user. Please try again.'
                    ),
                    kind: 'error',
                });
            }
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleCreateTinyUrl = async () => {
        const name = username.trim();
        const url = longUrl.trim();

        if (!name || !url) {
            setCreateTinyNotice({
                text: 'Please enter a username and a URL.',
                kind: 'error',
            });
            return;
        }

        if (isCreatingTiny) return;

        const version = usernameVersion.current;
        const shouldRefreshUserInfo = userInfo?.name === name;

        setIsCreatingTiny(true);
        setTinyUrl('');
        setCopyMessage('');
        setCreateTinyNotice(null);

        try {
            const response = await axiosInstance.post(
                globals.api.tiny,
                {
                    longUrl: url,
                    userName: name,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (
                typeof response.data !== 'string' ||
                !/^https?:\/\//i.test(response.data)
            ) {
                throw new Error('Unexpected URL response');
            }

            if (version !== usernameVersion.current) return;

            const result = response.data.endsWith('/')
                ? response.data
                : `${response.data}/`;

            setTinyUrl(result);
            setLongUrl('');

            setCreateTinyNotice({
                text: 'Your short link is ready.',
                kind: 'success',
            });

            if (shouldRefreshUserInfo) {
                try {
                    const updatedUser = await findUser(name);

                    if (version === usernameVersion.current) {
                        setUserInfo(updatedUser);

                        if (updatedUser === null) {
                            setUserInfoNotice({
                                text: 'User not found.',
                                kind: 'error',
                            });
                        }
                    }
                } catch (error) {
                    if (version === usernameVersion.current) {
                        setUserInfo(null);
                        setUserInfoNotice({
                            text: 'Link created. Click Get Info to refresh your links.',
                            kind: 'info',
                        });
                    }
                }
            }
        } catch (error) {
            if (version === usernameVersion.current) {
                setCreateTinyNotice({
                    text: errorMessage(
                        error,
                        'Unable to shorten this URL. Please try again.'
                    ),
                    kind: 'error',
                });
            }
        } finally {
            setIsCreatingTiny(false);
        }
    };

    const handleGetUserInfo = async () => {
        const name = username.trim();

        if (!name) {
            setUserInfoNotice({
                text: 'Please enter a username.',
                kind: 'error',
            });
            return;
        }

        if (isLoadingUser) return;

        const version = usernameVersion.current;

        setIsLoadingUser(true);
        setUserInfoNotice(null);
        setUserInfo(null);

        try {
            const user = await findUser(name);

            if (version !== usernameVersion.current) return;

            if (user === null) {
                setUserInfoNotice({
                    text: 'User not found.',
                    kind: 'error',
                });
                return;
            }

            setUserInfo(user);
        } catch (error) {
            if (version === usernameVersion.current) {
                setUserInfoNotice({
                    text: errorMessage(
                        error,
                        'Unable to load user information.'
                    ),
                    kind: 'error',
                });
            }
        } finally {
            setIsLoadingUser(false);
        }
    };

    const handleGetClicks = async () => {
        const name = username.trim();

        if (!name) {
            setClicksNotice({
                text: 'Please enter a username.',
                kind: 'error',
            });
            return;
        }

        if (isLoadingClicks) return;

        const version = usernameVersion.current;

        setIsLoadingClicks(true);
        setClicksNotice(null);
        setClicks([]);

        try {
            // Check MongoDB first, then read click events from Cassandra.
            // Keep the existing clicks endpoint compatible with keepalive jobs.
            const user = await findUser(name);

            if (version !== usernameVersion.current) return;

            if (user === null) {
                setClicksNotice({
                    text: 'User not found.',
                    kind: 'error',
                });
                return;
            }

            const response = await axiosInstance.get<ClickEntry[]>(
                globals.api.userClicks(name)
            );

            if (
                !Array.isArray(response.data) ||
                !response.data.every(isClickEntry)
            ) {
                throw new Error('Unexpected click-history response');
            }

            if (version !== usernameVersion.current) return;

            setClicks(response.data);

            if (response.data.length === 0) {
                setClicksNotice({
                    text: 'No clicks recorded for this user yet.',
                    kind: 'info',
                });
            }
        } catch (error) {
            if (version === usernameVersion.current) {
                setClicksNotice({
                    text: errorMessage(
                        error,
                        'Unable to load click history. Please try again.'
                    ),
                    kind: 'error',
                });
            }
        } finally {
            setIsLoadingClicks(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(tinyUrl);
            setCopyMessage('Copied!');
        } catch (error) {
            setCopyMessage(
                'Copy failed. You can select the link and copy it manually.'
            );
        }
    };

    const isChecking = serverStatus === 'checking';
    const shortEntries = Object.entries(userInfo?.shorts || {});

    return (
        <main className="tinyurl-app">
            <header className="title-header">
                <h1 className="title">
                    TinyURL - Shorten Your Links
                </h1>
                <p className="subtitle">
                    Create short links and explore click analytics.
                </p>
            </header>

            {serverStatus !== 'ready' && (
                <div
                    className={`server-notice ${
                        serverStatus === 'error' ? 'server-error' : ''
                    }`}
                    role="status"
                    aria-live="polite"
                >
                    {isChecking ? (
                        <span>
                            ⏳ Connecting to the free demo server.
                            The first visit may take a little longer...
                        </span>
                    ) : (
                        <>
                            <span>
                                The server is taking longer than expected.
                                You can retry the connection.
                            </span>
                            <button
                                type="button"
                                className="retry-button"
                                onClick={() =>
                                    setWakeRequest((count) => count + 1)
                                }
                            >
                                Retry connection
                            </button>
                        </>
                    )}
                </div>
            )}

            <div className="help-container">
                <button
                    type="button"
                    className="help-button"
                    onClick={() => setShowHelp((value) => !value)}
                    aria-expanded={showHelp}
                >
                    {showHelp
                        ? 'Hide project details'
                        : 'How does TinyURL work?'}
                </button>

                {showHelp && (
                    <div className="help-content">
                        <p>
                            <strong>Redis:</strong> stores short-link
                            mappings for fast redirects.
                        </p>
                        <p>
                            <strong>MongoDB:</strong> stores users,
                            link metadata and click counters.
                        </p>
                        <p>
                            <strong>Cassandra:</strong> records
                            individual click events for history and analytics.
                        </p>
                        <p className="help-note">
                            Public demo: do not enter personal or
                            sensitive information.
                        </p>
                    </div>
                )}
            </div>

            <div className="sections-container">
                <section className="section">
                    <h2 className="section-title">Create New User</h2>

                    <input
                        type="text"
                        value={username}
                        onChange={(event) =>
                            updateUsername(event.target.value)
                        }
                        placeholder="Username"
                        aria-label="Username for new user"
                        className="input"
                        disabled={isChecking}
                    />

                    <button
                        type="button"
                        onClick={handleCreateUser}
                        className="button create-user"
                        disabled={isCreatingUser || isChecking}
                    >
                        {isCreatingUser ? 'Creating...' : 'Create User'}
                    </button>

                    {createUserNotice && (
                        <p
                            className={`${createUserNotice.kind}-message`}
                            role="status"
                        >
                            {createUserNotice.text}
                        </p>
                    )}
                </section>

                <section className="section">
                    <h2 className="section-title">Create Tiny URL</h2>

                    <input
                        type="text"
                        value={username}
                        onChange={(event) =>
                            updateUsername(event.target.value)
                        }
                        placeholder="Username"
                        aria-label="Username for short URL"
                        className="input"
                        disabled={isChecking}
                    />

                    <input
                        type="text"
                        value={longUrl}
                        onChange={(event) =>
                            setLongUrl(event.target.value)
                        }
                        placeholder="Enter URL (e.g. example.com)"
                        aria-label="Original URL"
                        className="input"
                        disabled={isChecking}
                    />

                    <button
                        type="button"
                        onClick={handleCreateTinyUrl}
                        className="button create-tiny"
                        disabled={isCreatingTiny || isChecking}
                    >
                        {isCreatingTiny ? 'Creating...' : 'Create Tiny URL'}
                    </button>

                    {createTinyNotice && (
                        <p
                            className={`${createTinyNotice.kind}-message`}
                            role="status"
                        >
                            {createTinyNotice.text}
                        </p>
                    )}

                    {tinyUrl && (
                        <div className="result short-result">
                            <strong>Your Tiny URL:</strong>

                            <a
                                href={tinyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {tinyUrl}
                            </a>

                            <button
                                type="button"
                                className="copy-button"
                                onClick={handleCopy}
                            >
                                Copy link
                            </button>

                            {copyMessage && (
                                <span
                                    className="copy-feedback"
                                    role="status"
                                >
                                    {copyMessage}
                                </span>
                            )}
                        </div>
                    )}
                </section>

                <section className="section">
                    <h2 className="section-title">User Information</h2>

                    <input
                        type="text"
                        value={username}
                        onChange={(event) =>
                            updateUsername(event.target.value)
                        }
                        placeholder="Username"
                        aria-label="Username for user information"
                        className="input"
                        disabled={isChecking}
                    />

                    <button
                        type="button"
                        onClick={handleGetUserInfo}
                        className="button get-info"
                        disabled={isLoadingUser || isChecking}
                    >
                        {isLoadingUser ? 'Loading...' : 'Get Info'}
                    </button>

                    {userInfoNotice && (
                        <p
                            className={`${userInfoNotice.kind}-message`}
                            role="status"
                        >
                            {userInfoNotice.text}
                        </p>
                    )}

                    {userInfo && (
                        <div className="result">
                            <p className="user-info-name">
                                Name: {userInfo.name}
                            </p>

                            <p className="user-info-clicks">
                                Total Clicks: {userInfo.allUrlClicks}
                            </p>

                            <p className="short-urls">
                                Short URLs:
                            </p>

                            {shortEntries.length > 0 ? (
                                <ul className="short-url-details">
                                    {shortEntries.map(([code, info]) => {
                                        const counts = Object.entries(
                                            info?.clicks || {}
                                        );

                                        return (
                                            <li key={code}>
                                                <a
                                                    href={
                                                        `${globals.api.shortBase}/` +
                                                        `${encodeURIComponent(code)}/`
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {code}
                                                </a>

                                                {counts.length > 0 ? (
                                                    <ul>
                                                        {counts.map(
                                                            ([month, count]) => (
                                                                <li key={month}>
                                                                    {month}: {count} clicks
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                ) : (
                                                    <span className="zero-clicks">
                                                        0 clicks
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="info-message">
                                    No short URLs created yet.
                                </p>
                            )}
                        </div>
                    )}
                </section>

                <section className="section">
                    <h2 className="section-title">Click Details</h2>

                    <input
                        type="text"
                        value={username}
                        onChange={(event) =>
                            updateUsername(event.target.value)
                        }
                        placeholder="Username"
                        aria-label="Username for click details"
                        className="input"
                        disabled={isChecking}
                    />

                    <button
                        type="button"
                        onClick={handleGetClicks}
                        className="button get-clicks"
                        disabled={isLoadingClicks || isChecking}
                    >
                        {isLoadingClicks ? 'Loading...' : 'Get Clicks'}
                    </button>

                    {clicksNotice && (
                        <p
                            className={`${clicksNotice.kind}-message`}
                            role="status"
                        >
                            {clicksNotice.text}
                        </p>
                    )}

                    {clicks.length > 0 && (
                        <ul className="clicks-list">
                            {clicks.map((click, index) => (
                                <li
                                    key={
                                        `${click.tiny}-` +
                                        `${click.clickTime}-${index}`
                                    }
                                >
                                    <span className="click-date">
                                        {formatClickDate(click.clickTime)}
                                    </span>

                                    <span className="click-url">
                                        {click.longUrl}
                                    </span>

                                    <span className="click-code">
                                        Tiny: {click.tiny}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
};

export default TinyUrlApp;
