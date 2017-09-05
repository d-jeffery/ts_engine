import * as TSE from '../../lib';
import Maze from './maze';
import Lantern from './lantern';
import {TileType} from "./maze_part";

// Move dr
enum MoveDir {
    E = 0,
    SE = 45,
    S = 90,
    SW = 135,
    W = 180,
    NW = 225,
    N = 270,
    NE = 315,
}

/**
 * Controllable actor.
 */
export default class Player extends TSE.RectActor {

    public lantern: Lantern;
    public maze: Maze;
    /**
     * Mouse status.
     */
    public ms: {l: boolean, r: boolean, p: TSE.Math.IPoint};
    /**
     * Old position.
     */
    private oldP: TSE.Math.IPoint;

    public init(): void {
        this.ms = {l: false, r: false, p: null};
        this.debugColour = 'orange';
        const canvas: HTMLCanvasElement = this.st.ctx.canvas;
        // Update ms p
        canvas.addEventListener('mousemove', (event: MouseEvent) => {
            const rect = this.st.ctx.canvas.getBoundingClientRect();
            this.ms.p = {x: event.clientX - rect.left, y: event.clientY - rect.top};
        }, true);
        // Capture click
        canvas.addEventListener('mousedown', (event: MouseEvent) => {
            event.preventDefault();
            const rect = this.st.ctx.canvas.getBoundingClientRect();
            this.ms.p = {x: event.clientX - rect.left, y: event.clientY - rect.top};
            this.ms.l = event.button === 0;
            this.ms.r = event.button === 2;
        }, true);

        // Prevent r click menu
        canvas.oncontextmenu = (event) => {
            event.preventDefault();
        };
    }

    public update(step: number): void {
        super.update(step);
        this.doMove(step);
        this.maze.setAdjacentTilesSeen(this.lantern);
        this.lantern.updatePosition();
        this.ms.l = false;
        this.ms.r = false;
    }

    protected drawDebug(): void {
        const ctx = this.st.ctx;
        ctx.save();
        ctx.fillStyle = this.debugColour;
        ctx.fillRect(this.p.x, this.p.y, this.w, this.h);
        ctx.restore();
    }

    private doMove(step: number): void {
        const controls: TSE.Controller = new TSE.Controller();

        const fraction: number = (step / 100);
        const speed: number = fraction * 24;
        // Get current dr
        let dir: MoveDir;

        if (controls.isPressed(TSE.Controller.keys.W) || controls.isPressed(TSE.Controller.keys.UP)) {
            dir = MoveDir.N;
        }

        if (controls.isPressed(TSE.Controller.keys.S) || controls.isPressed(TSE.Controller.keys.DOWN)) {
            dir = MoveDir.S;
        }

        if (controls.isPressed(TSE.Controller.keys.A) || controls.isPressed(TSE.Controller.keys.LEFT)) {
            if (dir === MoveDir.N) {
                dir = MoveDir.NW;
            } else if (dir === MoveDir.S) {
                dir = MoveDir.SW;
            } else {
                dir = MoveDir.W;
            }
        }

        if (controls.isPressed(TSE.Controller.keys.D) || controls.isPressed(TSE.Controller.keys.RIGHT)) {
            if (dir === MoveDir.N) {
                dir = MoveDir.NE;
            } else if (dir === MoveDir.S) {
                dir = MoveDir.SE;
            } else {
                dir = MoveDir.E;
            }
        }

        // No dr, no move
        if (typeof dir === 'undefined') {
            return;
        }

        // Set to new location, with slide
        this.oldP = this.p;
        const newX = this.p.x + speed * Math.cos(dir * (Math.PI / 180));
        this.p = {x: newX, y: this.p.y};
        if (this.maze.isRectActorColliding(this)) {
            this.p = this.oldP;
        }
        this.oldP = this.p;
        const newY = this.p.y + speed * Math.sin(dir * (Math.PI / 180));
        this.p = {x: this.p.x, y: newY};
        if (this.maze.isRectActorColliding(this)) {
            this.p = this.oldP;
        }

        const tile: TileType = this.maze.getTileAtPosition({
            x: this.p.x + this.w / 2,
            y: this.p.y + this.h / 2
        });

        if (tile === TileType.E) {
            console.log('finished');
            this.st.finished = true;
        }
    }

}
