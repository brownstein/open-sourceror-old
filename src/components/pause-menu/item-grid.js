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

    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();

    const scene = new Scene();
    const renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setClearAlpha(0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvasRect.width, canvasRect.height);

    const camera = new OrthographicCamera(
      -10, 10,
      -10, 10,
      -32, 32
    );
    camera.lookAt(new Vector3(0, 0, -1));

    async function initAllIcons() {
      // by this point, we have access to the canvas reference, so we can go
      // ahead and start drawing things on each grid item
      const icons = [new Scroll().getIcon()];
      await Promise.all(icons.map(i => i.readyPromise));

      let x = 0;
      icons.forEach(icon => {
        icon.mesh.position.x = x;
        x += 100;
        scene.add(icon.mesh);
      });

      const parentRect = canvas.getBoundingClientRect();
      for (let si = 0; si < slots; si++) {
        const gridItem = itemRefs.current[si];
        if (!gridItem) {
          return;
        }
        const rect = gridItem.getBoundingClientRect();
        renderer.setScissor(
          rect.left - parentRect.left,
          rect.top - parentRect.top,
          rect.width,
          rect.height
        );
        renderer.setScissorTest(true);
        renderer.render(scene, camera);
      }
    }

    initAllIcons();

    return () => {
      renderer.dispose();
    };
  }, []);

  const gridItems = [];
  for (let i = 0; i < slots; i++) {
    const ii = i;
    gridItems.push(
      <div
      key={i}
      ref={el => itemRefs.current[ii] = el}
      className="grid-item"
      />
    );
  }

  return (
    <div className="item-grid">
      <canvas ref={canvasRef} className="canvas-overlay"/>
      {gridItems}
    </div>
  );
}
