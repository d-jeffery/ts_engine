import * as TSE from '../lib';
import {EndScreen} from './stage/end_screen';
import Level1 from './stage/level_1';
import Level2 from './stage/level_2';

const WIDTH: number = 640;
const HEIGHT: number = 480;
const CANVAS: string = 'game';
const LOADER: TSE.AssetLoader = new TSE.AssetLoader();

function setupEngine(width: number, height: number, canvasId: string): TSE.Engine {
    const engine = new TSE.Engine(width, height, document.getElementById(canvasId));
    LOADER.loadImage('mazetilemap',  'assets/images/mazetiles.png');

    const preloadStage: TSE.PreloaderStage = new TSE.PreloaderStage(width, height);
    engine.setStage(preloadStage);

    engine.setStageTransition(() => {
        if (engine.currentStage instanceof TSE.PreloaderStage) {
            initLevelOne();
        } else if (engine.currentStage instanceof Level1) {
            initLevelTwo();
        }  else if (engine.currentStage instanceof Level2) {
            initGameOver();
        }
    });

    return engine;
}

function initLevelOne(): void {
    ENGINE.setStage(new Level1(WIDTH, HEIGHT));
}

function initLevelTwo(): void {
    ENGINE.setStage(new Level2(WIDTH, HEIGHT));
}

function initGameOver(): void {
    ENGINE.setStage(new EndScreen(WIDTH, HEIGHT));
}
// TODO: write JSON parser, move stages tiling to JSON doc

const ENGINE: TSE.Engine = setupEngine(WIDTH, HEIGHT, CANVAS);
ENGINE.start();
