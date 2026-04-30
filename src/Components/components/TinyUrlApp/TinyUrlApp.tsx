import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/axiosInstance'; // Using the custom interceptor
import './TinyUrlApp.css';
import globals from '../../../utils/globals';
import { parse, format } from 'date-fns';

interface ShortUrl {
    clicks: { [key: string]: number };
}

interface UserInfo {
    name: string;
    allUrlClicks: number;
    shorts: { [key: string]: ShortUrl } | null;
}

const TinyUrlApp: React.FC = () => {
    const [username, setUsername] = useState('');
    const [longUrl, setLongUrl] = useState('');
    const [tinyUrl, setTinyUrl] = useState('');
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [clicks, setClicks] = useState<any[]>([]);
    const [createUserMessage, setCreateUserMessage] = useState('');
    const [createTinyMessage, setCreateTinyMessage] = useState('');
    const [userInfoMessage, setUserInfoMessage] = useState('');
    const [clicksMessage, setClicksMessage] = useState('');
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    
    // Cold start state
    const [isWakingUp, setIsWakingUp] = useState(false);

    // Listeners for cold start events
    useEffect(() => {
        const handleWakeUp = () => setIsWakingUp(true);
        const handleAwake = () => setIsWakingUp(false);

        window.addEventListener('serverWakingUp', handleWakeUp);
        window.addEventListener('serverAwake', handleAwake);

        return () => {
            window.removeEventListener('serverWakingUp', handleWakeUp);
            window.removeEventListener('serverAwake', handleAwake);
        };
    }, []);

    const formatDate = (dateStr: string) => {
        try {
            const parsedDate = parse(dateStr, 'yyyy-MM-dd HH:mm:ss', new Date());
            return format(parsedDate, 'dd/MM/yyyy \'at\' HH:mm:ss');
        } catch (error) {
            console.error('Error parsing date:', dateStr, error);
            return 'Invalid date';
        }
    };

    const handleCreateUser = async () => {
        if (!username) {
            setCreateUserMessage('Please enter a username');
            return;
        }
        if (isCreatingUser) return;
        setIsCreatingUser(true);
        try {
            const response = await axiosInstance.post(`${globals.api.user}?name=${username}`);
            setCreateUserMessage(response.data);
        } catch (error: any) {
            setIsWakingUp(false);
            const message = error.response?.data || 'Error creating user';
            setCreateUserMessage(message);
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleCreateTinyUrl = async () => {
        if (!username || !longUrl) {
            setCreateTinyMessage('Please fill all fields');
            return;
        }
        try {
            const response = await axiosInstance.post(
                globals.api.tiny,
                { longUrl, userName: username },
                { headers: { 'Content-Type': 'application/json' } }
            );
            const cleanTinyUrl = response.data.endsWith('/') ? response.data : `${response.data}/`;
            setTinyUrl(cleanTinyUrl);
            setCreateTinyMessage('');
            setLongUrl('');
        } catch (error: any) {
            setIsWakingUp(false);
            setCreateTinyMessage(error.response?.data || 'Error creating tiny URL');
        }
    };

    const handleGetUserInfo = async () => {
        if (!username) {
            setUserInfoMessage('Please enter a username');
            return;
        }
        try {
            const response = await axiosInstance.get(globals.api.userInfo(username));
            if (response.data) {
                setUserInfo(response.data);
                setUserInfoMessage('');
            } else {
                setUserInfoMessage('User not found');
            }
        } catch (error: any) {
            setIsWakingUp(false);
            setUserInfoMessage(error.response?.data || 'Error fetching user info');
        }
    };

    const handleGetClicks = async () => {
        if (!username) {
            setClicksMessage('Please enter a username');
            return;
        }
        try {
            const response = await axiosInstance.get(globals.api.userClicks(username));
            if (Array.isArray(response.data) && response.data.length > 0) {
                setClicks(response.data);
                setClicksMessage('');
            } else {
                setClicks([]);
                setClicksMessage('No clicks found for this user');
            }
        } catch (error: any) {
            setIsWakingUp(false);
            setClicks([]);
            setClicksMessage(error.response?.data?.message || 'Error fetching clicks');
        }
    };

    return (
        <div className="tinyurl-app">
            <h1 className="title">TinyURL - Shorten Your Links</h1>
            
            {isWakingUp && (
                <div className="waking-up-msg">
                    ⏳ Initializing free server tier. The backend needs about 10 seconds to wake up for the first search. After that, everything will be instant!
                </div>
            )}

            <div className="sections-container">
                <div className="section">
                    <h2 className="section-title">Create New User</h2>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="input"
                        disabled={isWakingUp}
                    />
                    <button
                        onClick={handleCreateUser}
                        className="button create-user"
                        disabled={isCreatingUser || isWakingUp}
                    >
                        {isCreatingUser ? 'Creating...' : 'Create User'}
                    </button>
                    {createUserMessage && (
                        <p className={createUserMessage.includes('successfully') ? 'success-message' : 'error-message'}>
                            {createUserMessage}
                        </p>
                    )}
                </div>
                <div className="section">
                    <h2 className="section-title">Create Tiny URL</h2>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="input"
                        disabled={isWakingUp}
                    />
                    <input
                        type="text"
                        value={longUrl}
                        onChange={(e) => setLongUrl(e.target.value)}
                        placeholder="Enter URL (e.g., https://www.one.co.il)"
                        className="input"
                        disabled={isWakingUp}
                    />
                    <button onClick={handleCreateTinyUrl} className="button create-tiny" disabled={isWakingUp}>
                        Create Tiny URL
                    </button>
                    {createTinyMessage && <p className="error-message">{createTinyMessage}</p>}
                    {tinyUrl && (
                        <p className="result">
                            Your Tiny URL:{' '}
                            <a
                                href={tinyUrl}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                onClick={(e) => {
                                    e.preventDefault();
                                    const cleanUrl = tinyUrl.endsWith('/') ? tinyUrl : `${tinyUrl}/`;
                                    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
                                }}
                            >
                                {tinyUrl}
                            </a>
                        </p>
                    )}
                </div>
                <div className="section">
                    <h2 className="section-title">User Information</h2>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="input"
                        disabled={isWakingUp}
                    />
                    <button onClick={handleGetUserInfo} className="button get-info" disabled={isWakingUp}>
                        Get Info
                    </button>
                    {userInfoMessage && <p className="error-message">{userInfoMessage}</p>}
                    {userInfo && (
                        <div className="result">
                            <p className="user-info-name">Name: {userInfo.name}</p>
                            <p className="user-info-clicks">Total Clicks: {userInfo.allUrlClicks}</p>
                            <p className="short-urls">Short URLs:</p>
                            {userInfo.shorts && Object.keys(userInfo.shorts).length > 0 ? (
                                <ul className="short-url-details">
                                    {Object.entries(userInfo.shorts).map(([key, value]) => (
                                        <li key={key}>
                                            {key}:
                                            <ul>
                                                {Object.entries(value.clicks).map(([date, clicks]) => (
                                                    <li key={date}>{date}: {clicks} clicks</li>
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="error-message">No short URLs created yet</p>
                            )}
                        </div>
                    )}
                </div>
                <div className="section">
                    <h2 className="section-title">Click Details</h2>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="input"
                        disabled={isWakingUp}
                    />
                    <button onClick={handleGetClicks} className="button get-clicks" disabled={isWakingUp}>
                        Get Clicks
                    </button>
                    {clicksMessage && <p className="error-message">{clicksMessage}</p>}
                    {clicks.length > 0 && (
                        <ul className="clicks-list">
                            {clicks.map((click, index) => (
                                <li key={index}>
                                    {formatDate(click.clickTime)} - {click.longUrl} (Tiny: {click.tiny})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TinyUrlApp;