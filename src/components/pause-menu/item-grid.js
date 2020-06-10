import {
  useState,
  useEffect,
  useRef
} from "react";
import {
  Box3,
  Box2,
  Color,
  WebGLRenderer,
  Camera,
  OrthographicCamera,
  Scene,
  Vector3,
  Vector2
} from "three";

import Scroll from "src/entities/items/scroll";

import "./item-grid.less";

export default function ItemGrid({
  slots = 64,
  width = 8
}) {
  const canvasRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {

    const scene = new Scene();
    const renderer = new WebGLRenderer({
      canvas: canvasRef.current
    });
    renderer.setClearColor(new Color("#ffffff"), 0);
    renderer.setPixelRatio(window.devicePixelRatio);

    console.log(itemRefs.current);

    async function initAllIcons() {
      // by this point, we have access to the canvas reference, so we can go
      // ahead and start drawing things on each grid item
      const icons = [new Scroll().getIcon()];
      await Promise.all(icons.map(i => i.readyPromise));

      let x = 0;
      icons.forEach(icon => {
        x += 100;
        icon.mesh.position.x = x;
        scene.add(icon.mesh);
      });

      console.log(">>>>>");
    }

    initAllIcons();

    return () => {
      renderer.dispose();
    };
  }, []);

  const gridItems = [];
  for (let i = 0; i < slots; i++) {
    gridItems.push(
      <div
      key={i}
      ref={el => itemRefs.current[i] = el}
      className="grid-item"
      >
        {i}
      </div>
    );
  }

  return (
    <div className="item-grid">
      <canvas ref={canvasRef} className="canvas-overlay"/>
      {gridItems}
    </div>
  );
}
