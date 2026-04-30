class Globals {
    public api!: {
        user: string;
        tiny: string;
        userInfo: (username: string) => string;
        userClicks: (username: string) => string;
    };
}

export class DevelopmentGlobals extends Globals {
    // Dynamically get the host to support localhost and local network IP testing
    private static host = window.location.hostname;
    
    constructor() {
        super();
        this.api = {
            user: `http://${DevelopmentGlobals.host}:8080/user`,
            tiny: `http://${DevelopmentGlobals.host}:8080/tiny`,
            userInfo: (username: string) => `http://${DevelopmentGlobals.host}:8080/user/${username}`,
            userClicks: (username: string) => `http://${DevelopmentGlobals.host}:8080/user/${username}/clicks`,
        };
    }
}

export class ProductionGlobals extends Globals {
    constructor() {
        super();
        this.api = {
            user: 'https://surl.runmydocker-app.com/user',
            tiny: 'https://surl.runmydocker-app.com/tiny',
            userInfo: (username: string) => `https://surl.runmydocker-app.com/user/${username}`,
            userClicks: (username: string) => `https://surl.runmydocker-app.com/user/${username}/clicks`,
        };
    }
}

const globals = process.env.NODE_ENV === 'production'
    ? new ProductionGlobals()
    : new DevelopmentGlobals();

export default globals;