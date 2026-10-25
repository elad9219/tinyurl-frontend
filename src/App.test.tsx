
import React from 'react';
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import App from './App';

jest.mock('axios', () => {
    const client = {
        get: jest.fn(),
        post: jest.fn(),
        interceptors: {
            response: {
                use: jest.fn(),
            },
        },
    };

    return {
        __esModule: true,
        default: {
            create: jest.fn(() => client),
            get: jest.fn().mockResolvedValue({
                status: 200,
                data: {
                    status: 'UP',
                },
            }),
            isAxiosError: jest.fn(() => false),
        },
    };
});

test('renders all four TinyURL features', () => {
    render(<App />);

    expect(
        screen.getByRole('heading', {
            name: /TinyURL - Shorten Your Links/i,
        })
    ).toBeInTheDocument();

    expect(
        screen.getByRole('heading', {
            name: 'Create New User',
        })
    ).toBeInTheDocument();

    expect(
        screen.getByRole('heading', {
            name: 'Create Tiny URL',
        })
    ).toBeInTheDocument();

    expect(
        screen.getByRole('heading', {
            name: 'User Information',
        })
    ).toBeInTheDocument();

    expect(
        screen.getByRole('heading', {
            name: 'Click Details',
        })
    ).toBeInTheDocument();

    expect(
        screen.queryByText(
            /Connecting to the free demo server/i
        )
    ).not.toBeInTheDocument();
});

test('opens and closes the database help section', () => {
    render(<App />);

    fireEvent.click(
        screen.getByRole('button', {
            name: 'How does TinyURL work?',
        })
    );

    expect(
        screen.getByText(
            /stores short-link mappings for fast redirects/i
        )
    ).toBeInTheDocument();

    expect(
        screen.getByText(
            /records individual click events/i
        )
    ).toBeInTheDocument();

    fireEvent.click(
        screen.getByRole('button', {
            name: 'Hide project details',
        })
    );

    expect(
        screen.queryByText(
            /stores short-link mappings for fast redirects/i
        )
    ).not.toBeInTheDocument();
});
