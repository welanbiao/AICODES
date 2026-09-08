import "./style.css";
import { Game } from "./game";
import { onViewportChange, pinToViewport } from "./fit";

const app = document.getElementById("app") as HTMLElement;
const canvas = document.getElementById("view") as HTMLCanvasElement;

const layout = () => {
  pinToViewport(app);
};

const game = new Game(canvas);
layout();
onViewportChange(() => {
  layout();
  game.resize();
});
window.addEventListener("orientationchange", () => game.resize());
window.addEventListener("resize", () => game.resize());
