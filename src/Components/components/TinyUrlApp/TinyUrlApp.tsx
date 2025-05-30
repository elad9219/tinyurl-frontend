import React, { useState } from 'react';
import axios from 'axios';
import './TinyUrlApp.css';
import globals from '../../../utils/globals';
import { parse, format } from 'date-fns';

// Define the structure of ShortUrl
interface ShortUrl {
    clicks: { [key: string]: number };
}

// Define the structure of UserInfo
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
    const [isCreatingUser, setIsCreatingUser] = useState(false); // Prevent duplicate requests

const formatDate = (dateStr: string) => {
    try {
        const parsedDate = parse(dateStr, 'yyyy-MM-dd HH:mm:ss', new Date());
        return format(parsedDate, 'dd/MM/yyyy \'at\' HH:mm:ss');
    } catch (error) {
        console.error('Error parsing date:', dateStr, error);
        return 'Invalid date';
    }
};

    // Handle user creation
    const handleCreateUser = async () => {
        if (!username) {
            setCreateUserMessage('Please enter a username');
            return;
        }
        if (isCreatingUser) return; // Prevent duplicate requests
        setIsCreatingUser(true);
        try {
            const response = await axios.post(`${globals.api.user}?name=${username}`);
            setCreateUserMessage(response.data); // Expect "User created successfully"
        } catch (error: any) {
            const message = error.response?.data || 'Error creating user';
            setCreateUserMessage(message);
            console.error('Error creating user:', message);
        } finally {
            setIsCreatingUser(false);
        }
    };

    // Handle tiny URL creation
    const handleCreateTinyUrl = async () => {
        if (!username || !longUrl) {
            setCreateTinyMessage('Please fill all fields');
            return;
        }
        try {
            const response = await axios.post(
                globals.api.tiny,
                { longUrl, userName: username },
                { headers: { 'Content-Type': 'application/json' } }
            );
            const cleanTinyUrl = response.data.endsWith('/') ? response.data : `${response.data}/`;
            setTinyUrl(cleanTinyUrl);
            setCreateTinyMessage('');
            setLongUrl('');
        } catch (error: any) {
            setCreateTinyMessage(error.response?.data || 'Error creating tiny URL');
            console.error(error);
        }
    };

    // Handle getting user information
    const handleGetUserInfo = async () => {
        if (!username) {
            setUserInfoMessage('Please enter a username');
            return;
        }
        try {
            const response = await axios.get(globals.api.userInfo(username));
            if (response.data) {
                setUserInfo(response.data);
                setUserInfoMessage('');
            } else {
                setUserInfoMessage('User not found');
            }
        } catch (error: any) {
            setUserInfoMessage(error.response?.data || 'Error fetching user info');
            console.error(error);
        }
    };

    // Handle getting click details
    const handleGetClicks = async () => {
        if (!username) {
            setClicksMessage('Please enter a username');
            return;
        }
        try {
            const response = await axios.get(globals.api.userClicks(username));
            console.log('Clicks response:', response.data); // Debug log
            if (Array.isArray(response.data) && response.data.length > 0) {
                setClicks(response.data);
                setClicksMessage('');
            } else {
                setClicks([]);
                setClicksMessage('No clicks found for this user');
            }
        } catch (error: any) {
            console.error('Error fetching clicks:', error);
            setClicks([]);
            setClicksMessage(error.response?.data?.message || 'Error fetching clicks');
        }
    };

    return (
        <div className="tinyurl-app">
            <h1 className="title">TinyURL - Shorten Your Links</h1>
            <div className="sections-container">
                <div className="section">
                    <h2 className="section-title">Create New User</h2>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="input"
                    />
                    <button
                        onClick={handleCreateUser}
                        className="button create-user"
                        disabled={isCreatingUser} // Disable button during request
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
                    />
                    <input
                        type="text"
                        value={longUrl}
                        onChange={(e) => setLongUrl(e.target.value)}
                        placeholder="Enter URL (e.g., https://www.one.co.il)"
                        className="input"
                    />
                    <button onClick={handleCreateTinyUrl} className="button create-tiny">
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
                    />
                    <button onClick={handleGetUserInfo} className="button get-info">
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
                    />
                    <button onClick={handleGetClicks} className="button get-clicks">
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