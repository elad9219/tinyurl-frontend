
class Globals {
    public api!: {
        user: string;
        tiny: string;
        health: string;
        shortBase: string;
        userInfo: (username: string) => string;
        userClicks: (username: string) => string;
    };

    protected configure(base: string): void {
        this.api = {
            user: `${base}/user`,
            tiny: `${base}/tiny`,
            health: `${base}/v2/api-docs`,
            shortBase: base,
            userInfo: (username: string) =>
                `${base}/user/${encodeURIComponent(username)}`,
            userClicks: (username: string) =>
                `${base}/user/${encodeURIComponent(username)}/clicks`,
        };
    }
}

export class DevelopmentGlobals extends Globals {
    constructor() {
        super();
        this.configure(`http://${window.location.hostname}:8080`);
    }
}

export class ProductionGlobals extends Globals {
    constructor() {
        super();
        this.configure('https://url.runmydocker-app.com');
    }
}

const globals = process.env.NODE_ENV === 'production'
    ? new ProductionGlobals()
    : new DevelopmentGlobals();

export default globals;
