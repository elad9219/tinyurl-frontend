class Globals {
    public api!: {
        user: string;
        tiny: string;
        userInfo: (username: string) => string;
        userClicks: (username: string) => string;
    };
}

export class DevelopmentGlobals extends Globals {
    constructor() {
        super();
        this.api = {
            user: 'http://localhost:8080/user',
            tiny: 'http://localhost:8080/tiny',
            userInfo: (username: string) => `http://localhost:8080/user/${username}`,
            userClicks: (username: string) => `http://localhost:8080/user/${username}/clicks`,
        };
    }
}

export class ProductionGlobals extends Globals {
    constructor() {
        super();
        this.api = {
            user: '/user',
            tiny: '/tiny',
            userInfo: (username: string) => `/user/${username}`,
            userClicks: (username: string) => `/user/${username}/clicks`,
        };
    }
}

const globals = process.env.NODE_ENV === 'production'
    ? new ProductionGlobals()
    : new DevelopmentGlobals();

export default globals;