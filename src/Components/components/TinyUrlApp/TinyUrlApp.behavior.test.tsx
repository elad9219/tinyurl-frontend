
import React from 'react';
import {
    act,
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
        isAxiosError: (error: any) =>
            Boolean(error?.isAxiosError),
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
const apiPost = axiosInstance.post as jest.Mock;

beforeEach(() => {
    healthGet.mockReset();
    apiGet.mockReset();
    apiPost.mockReset();

    healthGet.mockResolvedValue({
        status: 200,
        data: { status: 'UP' },
    });
});

test('starts a quiet health check without disabling inputs', async () => {
    render(<TinyUrlApp />);

    expect(
        screen.getByLabelText('Username for new user')
    ).toBeEnabled();

    expect(
        screen.getByRole('button', { name: 'Create User' })
    ).toBeEnabled();

    expect(
        screen.queryByText(/Connecting to the free demo server/i)
    ).not.toBeInTheDocument();

    await waitFor(() =>
        expect(healthGet).toHaveBeenCalledWith(
            expect.stringContaining('/actuator/health'),
            expect.any(Object)
        )
    );
});

test('queues a create-user click and submits once after waking', async () => {
    let finishWake!: (value: unknown) => void;

    healthGet.mockReturnValueOnce(
        new Promise((resolve) => {
            finishWake = resolve;
        })
    );

    apiPost.mockResolvedValue({
        status: 200,
        data: 'User created successfully',
    });

    render(<TinyUrlApp />);

    fireEvent.change(
        screen.getByLabelText('Username for new user'),
        { target: { value: 'alice' } }
    );

    fireEvent.click(
        screen.getByRole('button', { name: 'Create User' })
    );

    expect(
        screen.getByText(/Your action will run automatically/i)
    ).toBeInTheDocument();

    expect(apiPost).not.toHaveBeenCalled();

    await act(async () => {
        finishWake({
            status: 200,
            data: { status: 'UP' },
        });
    });

    await waitFor(() =>
        expect(apiPost).toHaveBeenCalledTimes(1)
    );

    expect(apiPost).toHaveBeenCalledWith(
        expect.stringContaining('/user'),
        null,
        { params: { name: 'alice' } }
    );

    expect(
        await screen.findByText('User created successfully.')
    ).toBeInTheDocument();
});

test('does not submit an old username changed during warmup', async () => {
    let finishWake!: (value: unknown) => void;

    healthGet.mockReturnValueOnce(
        new Promise((resolve) => {
            finishWake = resolve;
        })
    );

    render(<TinyUrlApp />);

    const input = screen.getByLabelText(
        'Username for new user'
    );

    fireEvent.change(input, {
        target: { value: 'old' },
    });

    fireEvent.click(
        screen.getByRole('button', { name: 'Create User' })
    );

    fireEvent.change(input, {
        target: { value: 'new' },
    });

    await act(async () => {
        finishWake({
            status: 200,
            data: { status: 'UP' },
        });
    });

    expect(apiPost).not.toHaveBeenCalled();
});

test('Get Info reports a missing user with an empty 404 body', async () => {
    apiGet.mockResolvedValueOnce({
        status: 404,
        data: '',
    });

    render(<TinyUrlApp />);

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

    render(<TinyUrlApp />);

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

    render(<TinyUrlApp />);

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

test('special usernames use query parameters for user details and clicks', async () => {
    apiGet.mockResolvedValue({
        status: 200,
        data: {
            name: 'legacy/name',
            allUrlClicks: 1,
            shorts: {},
        },
    });

    render(<TinyUrlApp />);

    fireEvent.change(
        screen.getByLabelText('Username for user information'),
        { target: { value: 'legacy/name' } }
    );

    fireEvent.click(
        screen.getByRole('button', { name: 'Get Info' })
    );

    expect(
        await screen.findByText('Name: legacy/name')
    ).toBeInTheDocument();

    expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining(
            '/user?name=legacy%2Fname'
        ),
        expect.any(Object)
    );

    apiGet.mockReset();

    apiGet
        .mockResolvedValueOnce({
            status: 200,
            data: {
                name: 'legacy/name',
                allUrlClicks: 1,
                shorts: {},
            },
        })
        .mockResolvedValueOnce({
            status: 200,
            data: [],
        });

    fireEvent.click(
        screen.getByRole('button', { name: 'Get Clicks' })
    );

    expect(
        await screen.findByText(
            'No clicks recorded for this user yet.'
        )
    ).toBeInTheDocument();

    expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining(
            '/user/clicks?name=legacy%2Fname'
        )
    );
});

test('displays valid click history and preserves date formatting', async () => {
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
            data: [
                {
                    clickTime: '2026-10-22 12:34:56',
                    tiny: 'AbCd12',
                    longUrl: 'https://example.com',
                },
            ],
        });

    render(<TinyUrlApp />);

    fireEvent.change(
        screen.getByLabelText('Username for click details'),
        { target: { value: 'alice' } }
    );

    fireEvent.click(
        screen.getByRole('button', { name: 'Get Clicks' })
    );

    expect(
        await screen.findByText('https://example.com')
    ).toBeInTheDocument();

    expect(
        screen.getByText('Tiny: AbCd12')
    ).toBeInTheDocument();

    expect(
        screen.getByText('22/10/2026 at 12:34:56')
    ).toBeInTheDocument();
});

test('shows a network error instead of an empty result', async () => {
    apiGet.mockRejectedValueOnce(
        Object.assign(
            new Error('Network Error'),
            {
                isAxiosError: true,
                code: 'ERR_NETWORK',
            }
        )
    );

    render(<TinyUrlApp />);

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
