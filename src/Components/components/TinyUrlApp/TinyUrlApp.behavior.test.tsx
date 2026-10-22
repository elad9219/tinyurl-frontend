import React from 'react';
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import axios from 'axios';
import axiosInstance from '../../../utils/axiosInstance';
import TinyUrlApp from './TinyUrlApp';

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        isAxiosError: (error: any) => Boolean(error?.isAxiosError),
    },
}));

jest.mock('../../../utils/axiosInstance', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
    },
}));

const healthGet = axios.get as jest.Mock;
const apiGet = axiosInstance.get as jest.Mock;

beforeEach(() => {
    healthGet.mockReset();
    apiGet.mockReset();

    healthGet.mockResolvedValue({
        status: 200,
        data: { swagger: '2.0' },
    });
});

async function readyPage() {
    render(<TinyUrlApp />);

    await waitFor(() => {
        expect(
            screen.getByRole('button', { name: 'Get Info' })
        ).toBeEnabled();
    });
}

test('Get Info reports a missing user with an empty 404 body', async () => {
    apiGet.mockResolvedValueOnce({
        status: 404,
        data: '',
    });

    await readyPage();

    fireEvent.change(
        screen.getByLabelText('Username for user information'),
        { target: { value: 'missing' } }
    );

    fireEvent.click(
        screen.getByRole('button', { name: 'Get Info' })
    );

    expect(
        await screen.findByText('User not found.')
    ).toBeInTheDocument();

    expect(apiGet).toHaveBeenCalledTimes(1);
});

test('Get Clicks skips Cassandra for a missing user', async () => {
    apiGet.mockResolvedValueOnce({
        status: 404,
        data: '',
    });

    await readyPage();

    fireEvent.change(
        screen.getByLabelText('Username for click details'),
        { target: { value: 'missing' } }
    );

    fireEvent.click(
        screen.getByRole('button', { name: 'Get Clicks' })
    );

    expect(
        await screen.findByText('User not found.')
    ).toBeInTheDocument();

    expect(apiGet).toHaveBeenCalledTimes(1);
});

test('Get Clicks reports a user with no click history', async () => {
    apiGet
        .mockResolvedValueOnce({
            status: 200,
            data: {
                name: 'alice',
                allUrlClicks: 0,
                shorts: {},
            },
        })
        .mockResolvedValueOnce({
            status: 200,
            data: [],
        });

    await readyPage();

    fireEvent.change(
        screen.getByLabelText('Username for click details'),
        { target: { value: 'alice' } }
    );

    fireEvent.click(
        screen.getByRole('button', { name: 'Get Clicks' })
    );

    expect(
        await screen.findByText(
            'No clicks recorded for this user yet.'
        )
    ).toBeInTheDocument();

    expect(apiGet).toHaveBeenCalledTimes(2);
});

test('displays valid user information and click history', async () => {
    apiGet.mockResolvedValue({
        status: 200,
        data: {
            name: 'alice',
            allUrlClicks: 1,
            shorts: {},
        },
    });

    await readyPage();

    fireEvent.change(
        screen.getByLabelText('Username for user information'),
        { target: { value: 'alice' } }
    );

    fireEvent.click(
        screen.getByRole('button', { name: 'Get Info' })
    );

    expect(
        await screen.findByText('Name: alice')
    ).toBeInTheDocument();

    expect(
        screen.getByText('Total Clicks: 1')
    ).toBeInTheDocument();

    apiGet.mockReset();

    apiGet
        .mockResolvedValueOnce({
            status: 200,
            data: {
                name: 'alice',
                allUrlClicks: 1,
                shorts: {},
            },
        })
        .mockResolvedValueOnce({
            status: 200,
            data: [{
                clickTime: '2026-10-22 12:34:56',
                tiny: 'AbCd12',
                longUrl: 'https://example.com',
            }],
        });

    fireEvent.click(
        screen.getByRole('button', { name: 'Get Clicks' })
    );

    expect(
        await screen.findByText('https://example.com')
    ).toBeInTheDocument();

    expect(
        screen.getByText('Tiny: AbCd12')
    ).toBeInTheDocument();
});

test('shows a network error instead of an empty result', async () => {
    apiGet.mockRejectedValueOnce(
        Object.assign(new Error('Network Error'), {
            isAxiosError: true,
            code: 'ERR_NETWORK',
        })
    );

    await readyPage();

    fireEvent.change(
        screen.getByLabelText('Username for user information'),
        { target: { value: 'alice' } }
    );

    fireEvent.click(
        screen.getByRole('button', { name: 'Get Info' })
    );

    expect(
        await screen.findByText(
            'Could not reach the server. Please try again.'
        )
    ).toBeInTheDocument();
});
