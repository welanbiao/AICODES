import "./style.css";
import { Game } from "./game";
import { onViewportChange, pinToViewport } from "./fit";

const app = document.getElementById("app") as HTMLElement;
const canvas = document.getElementById("view") as HTMLCanvasElement;

const game = new Game(canvas);
let viewKey = "";
const layout = () => {
  pinToViewport(app);
  const { w, h } = viewportBox();
  const key = `${Math.round(w)}x${Math.round(h)}`;
  if (key === viewKey) return;
  viewKey = key;
  game.resize();
};
layout();
onViewportChange(layout);

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.dispose());
}
