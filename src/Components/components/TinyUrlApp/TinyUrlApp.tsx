import React, { useState } from 'react';
import axios from 'axios';
import './TinyUrlApp.css';
import globals from '../../../utils/globals';

const TinyUrlApp: React.FC = () => {
    const [username, setUsername] = useState('');
    const [longUrl, setLongUrl] = useState('');
    const [tinyUrl, setTinyUrl] = useState('');
    const [userInfo, setUserInfo] = useState<any>(null);
    const [clicks, setClicks] = useState<any[]>([]);
    const [message, setMessage] = useState('');

    const handleCreateUser = async () => {
        if (!username) {
        setMessage('Please enter a username');
        return;
        }
        try {
        const response = await axios.post(globals.api.user, { name: username });
        setMessage(`User created successfully: ${response.data.name}`);
        setUsername('');
        } catch (error) {
        setMessage('Error creating user');
        console.error(error);
        }
    };

    const handleCreateTinyUrl = async () => {
        if (!username || !longUrl) {
        setMessage('Please fill all fields');
        return;
        }
        try {
        const response = await axios.post(globals.api.tiny, { longUrl, userName: username });
        setTinyUrl(response.data.tiny);
        setMessage(`Tiny URL created: ${response.data.tiny}`);
        setLongUrl('');
        } catch (error) {
        setMessage('Error creating tiny URL');
        console.error(error);
        }
    };

    const handleGetUserInfo = async () => {
        if (!username) {
        setMessage('Please enter a username');
        return;
        }
        try {
        const response = await axios.get(globals.api.userInfo(username));
        setUserInfo(response.data);
        setMessage('');
        } catch (error) {
        setMessage('Error fetching user info');
        console.error(error);
        }
    };

    const handleGetClicks = async () => {
        if (!username) {
        setMessage('Please enter a username');
        return;
        }
        try {
        const response = await axios.get(globals.api.userClicks(username));
        setClicks(response.data);
        setMessage('');
        } catch (error) {
        setMessage('Error fetching clicks');
        console.error(error);
        }
    };

    return (
        <div className="tinyurl-app">
        <h1 className="title">TinyURL - Shorten Your Links</h1>

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
            placeholder="Full URL (https://...)"
            className="input"
            />
            <button onClick={handleCreateTinyUrl} className="button create-tiny">
            Create Tiny URL
            </button>
            {tinyUrl && (
            <p className="result">
                Your Tiny URL:{' '}
                <a href={`${globals.api.user.replace('/user', '')}/${tinyUrl}`} target="_blank" rel="noopener noreferrer">
                {`${globals.api.user.replace('/user', '')}/${tinyUrl}`}
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
            {userInfo && (
            <div className="result">
                <p>Name: {userInfo.name}</p>
                <p>Total Clicks: {userInfo.allUrlClicks}</p>
                <p>Shorts: {JSON.stringify(userInfo.shorts)}</p>
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
            {clicks.length > 0 && (
            <ul className="clicks-list">
                {clicks.map((click, index) => (
                <li key={index}>
                    {click.clickTime}: {click.longUrl} (Tiny: {click.tiny})
                </li>
                ))}
            </ul>
            )}
        </div>

        {message && <p className="message">{message}</p>}
        </div>
    );
};

export default TinyUrlApp;