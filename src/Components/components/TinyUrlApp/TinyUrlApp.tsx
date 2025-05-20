import React, { useState } from 'react';
import axios from 'axios';
import './TinyUrlApp.css';
import globals from '../../../utils/globals';

// Define the structure of ShortUrl
interface ShortUrl {
    clicks: { [key: string]: number };
}

// Define the structure of UserInfo
interface UserInfo {
    name: string;
    allUrlClicks: number;
    shorts: { [key: string]: ShortUrl };
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

    // Format date to DD/MM/YYYY at HH:MM:SS
    const formatDate = (date: string) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} at ${hours}:${minutes}:${seconds}`;
    };

    // Handle user creation
    const handleCreateUser = async () => {
        if (!username) {
            setCreateUserMessage('Please enter a username');
            return;
        }
        try {
            await axios.post(`${globals.api.user}?name=${username}`);
            setCreateUserMessage('User created successfully');
        } catch (error: any) {
            setCreateUserMessage(error.response?.data || 'Error creating user');
            console.error(error);
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
            console.log('Tiny URL response:', response.data);
            let cleanTinyUrl = response.data.endsWith('/') ? response.data : `${response.data}/`;
            if (cleanTinyUrl.includes(longUrl)) {
                console.warn('Unexpected longUrl in response:', cleanTinyUrl);
                cleanTinyUrl = cleanTinyUrl.split(longUrl)[0];
            }
            console.log('Setting tinyUrl:', cleanTinyUrl);
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
            if (response.data.length > 0) {
                setClicks(response.data);
                setClicksMessage('');
            } else {
                setClicksMessage('No clicks found for this user');
            }
        } catch (error: any) {
            setClicksMessage(error.response?.data || 'Error fetching clicks');
            console.error(error);
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
                    <button onClick={handleCreateUser} className="button create-user">
                        Create User
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
                        placeholder="Enter URL (e.g., one.co.il)"
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
                                    let cleanUrl = tinyUrl.endsWith('/') ? tinyUrl : `${tinyUrl}/`;
                                    if (cleanUrl.includes(longUrl)) {
                                        cleanUrl = cleanUrl.split(longUrl)[0];
                                    }
                                    console.log('Opening URL:', cleanUrl);
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