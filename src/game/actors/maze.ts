import * as TSE from '../../lib';
import {MazePart, IMazeTile, TileType} from './maze_part';

/**
 * The m.
 */
export default class Maze extends TSE.RectActor {

    /**
     * MazePart Size.
     */
    public mpS: number;
    public needsUpdate: boolean;
    /**
     * Part Map.
     */
    private ptMp: MazePart[][];
    private tileMap: TSE.TileMapUtils.TileMap;
    private rows: number;
    private cols: number;

    constructor(width: number, height: number, mazePartSize: number) {
        super(TSE.Math.ORIGIN, width, height, {layer: 0});
        this.mpS = mazePartSize;
        this.rows = height / mazePartSize;
        this.cols = width / mazePartSize;
        this.ptMp = [];
        this.needsUpdate = true;
    }

    public setMazeParts(mazePartMap: MazePart[][]): void {
        this.ptMp = mazePartMap;
    }

    /**
     * Override.
     */
    public init(): void {
        const tileSize: number = 32;
        const cols: number = this.w / tileSize;
        const rows: number = this.h / tileSize;

        const tiles = new Array<number>(rows * cols);
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                tiles[i * cols + j] = 0;
            }
        }

        this.tileMap = new TSE.TileMapUtils.TileMap(rows, cols, tileSize, tiles);
    }

    /**
     * Override.
     */
    public update(step: number): void {
        super.update(step);
        if (this.needsUpdate) {
            this.updateTileMapWithMazeParts();
            this.needsUpdate = false;
        }
    }

    public iterateMazeParts(callback: Function): void {
        for (let row = 0; row < this.ptMp.length; row++) {
            for (let col = 0; col < this.ptMp[row].length; col++) {
                callback(this.ptMp[row][col], row, col);
            }
        }
    }

    public resetState(): void {
        this.iterateMazeParts((part: MazePart, row: number, col: number) => {
            part.actionable = false;
            part.hovered = false;
        });
    }

    /**
     * Override.
     */
    public render(): void {
        this.iterateMazeParts((part: MazePart, row: number, col: number) => {
            const length: number = part.lg;
            part.drawMazeParts(col * length, row * length, this.st.ctx);
        });
    }

    public drawMazePostEffects(): void {
        this.iterateMazeParts((part: MazePart, row: number, col: number) => {
            const length: number = part.lg;
            part.drawPostEffects(col * length, row * length, this.st.ctx);
        });
    }

    public getAdjacentMazeParts(pos: TSE.Math.IPoint): MazePart[] {
        if (pos.x < 0 || pos.x > this.w ||
            pos.y < 0 || pos.y > this.h) {
            return [];
        }
        const currentRow: number = Math.floor(pos.y / this.mpS);
        const currentCol: number = Math.floor(pos.x / this.mpS);
        if (!this.ptMp[currentRow]) {
            return [];
        }

        const returnArray: MazePart[] = [];
        if (currentRow - 1 >= 0) {
            returnArray.push(this.ptMp[currentRow - 1][currentCol]);
        }
        if (currentRow + 1 < this.rows) {
            returnArray.push(this.ptMp[currentRow + 1][currentCol]);
        }
        if (currentCol - 1 >= 0) {
            returnArray.push(this.ptMp[currentRow][currentCol - 1]);
        }
        if (currentCol + 1 < this.cols) {
            returnArray.push(this.ptMp[currentRow][currentCol + 1]);
        }

        return returnArray;
    }

    public getMazePartAtPosition(pos: TSE.Math.IPoint): MazePart {
        if (pos.x < 0 || pos.x > this.w ||
            pos.y < 0 || pos.y > this.h) {
            return null;
        }
        const currentRow: number = Math.floor(pos.y / this.mpS);
        const currentCol: number = Math.floor(pos.x / this.mpS);
        if (!this.ptMp[currentRow]) {
            return null;
        }

        return this.ptMp[currentRow][currentCol];
    }

    public getTileAtPosition(pos: TSE.Math.IPoint): any {
        if (pos.x < 0 || pos.x > this.w ||
            pos.y < 0 || pos.y > this.h) {
            return null;
        }
        const currentRow: number = Math.floor(pos.y / this.tileMap.tSz);
        const currentCol: number = Math.floor(pos.x / this.tileMap.tSz);

        return this.tileMap.getTile(currentRow, currentCol);
    }

    // This some hacky bullshit
    // TODO: Fix this hacky bullcrap
    public setAdjacentTilesSeen(actor: TSE.CircleActor): void {
        let mostTop: number = Math.floor((actor.p.y - actor.r) / this.mpS);
        let mostBottom: number = Math.floor((actor.p.y + actor.r) / this.mpS);
        let mostLeft: number = Math.floor((actor.p.x - actor.r) / this.mpS);
        let mostRight: number = Math.floor((actor.p.x + actor.r) / this.mpS);

        if (mostTop < 0) {
            mostTop = 0;
        }

        if (mostBottom > this.rows - 1) {
            mostBottom = this.rows - 1;
        }

        if (mostLeft < 0) {
            mostLeft = 0;
        }

        if (mostRight > this.cols - 1) {
            mostRight = this.cols - 1;
        }

        for (let i = mostLeft; i <= mostRight; i++) {
            for (let j = mostTop; j <= mostBottom; j++) {
                // Reposition actor because tilemap is skewed
                // Start of hacky bullcrap
                // TODO: Fix this hacky bullcrap
                const circleActor = new TSE.CircleActor({
                    x: actor.p.x - i * this.mpS,
                    y: actor.p.y - j * this.mpS
                }, actor.r);

                const tiles: TSE.TileMapUtils.Tile[] =
                    this.ptMp[j][i].ly.getTilesAdjacentToCircleActor(circleActor);
                for (let tile of tiles) {
                    tile.value.seen = true;
                }
                // End of hacky bullcrap
            }
        }

    }

    // http://jonathanwhiting.com/tutorial/collision/
    public isRectActorColliding(actor: TSE.RectActor): boolean {
        if (actor.p.x < 0 || actor.p.x + actor.w > this.w ||
            actor.p.y < 0 || actor.p.y + actor.h > this.h ) {
            return true;
        }

        const tiles: TSE.TileMapUtils.Tile[] = this.tileMap.getTilesAdjacentToRectActor(actor);

        if (tiles.length === 0) {
            return false;
        }

        for (const tile of tiles) {
            if (tile.value === TileType.W) {
                return true;
            }
        }

        return false;
    }

    private updateTileMapWithMazeParts(): void {
        this.iterateMazeParts((part: MazePart, row: number, col: number) => {
            for (let innerRow = 0; innerRow < part.di; innerRow++) {
                for (let innerCol = 0; innerCol < part.di; innerCol++) {
                    const tile: IMazeTile = part.ly.getTile(innerRow, innerCol);
                    this.tileMap.setTile(row * part.di + innerRow,
                        col * part.di + innerCol, tile.type);
                }
            }
        });
    }
}
