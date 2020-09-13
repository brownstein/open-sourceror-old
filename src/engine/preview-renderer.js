import {
  Component,
  useState,
  useEffect,
  useRef
} from "react";
import { useDrag, useDrop } from "react-dnd";
import { connect } from "react-redux";
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

/**
 * Shared WebGL context utility - there's a limit to the number of active\
 * WebGL canvases we can create, so reuse one and redraw the results to cheap
 * 2d canvas contexts
 */
export default class PreviewRenderer {
  constructor() {
    this.mounted = false;
    this.dpr = 0;

    this.webGlCanvas = null;
    this.canvasSize = new Vector2(40, 40);
    this.scenePreviewSize = new Vector2(20, 20);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }
  mount() {
    // set device pixel ratio
    this.dpr = window.devicePixelRatio;

    // initialize an offscreen canvas element
    this.webGLCanvas = document.createElement("canvas");
    this.webGLCanvas.width = this.canvasSize.x;
    this.webGLCanvas.height = this.canvasSize.y;

    // initialize three.js (including webgl context)
    this.scene = new Scene();
    this.renderer = new WebGLRenderer({
      canvas: this.webGLCanvas,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setClearAlpha(0);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(this.canvasSize.x, this.canvasSize.y);
    this.camera = new OrthographicCamera(
      -this.scenePreviewSize.x / 2, this.scenePreviewSize.x / 2,
      -this.scenePreviewSize.y / 2, this.scenePreviewSize.y / 2,
      -32, 32
    );
    this.camera.lookAt(new Vector3(0, 0, -1));

    this.mounted = true;
  }
  unmount() {
    console.log("TODO: preview renderer unmount");
  }
  renderPreview(mesh, targetCanvas, targetContext, targetCanvasSize = null) {
    const { dpr } = this;

    // find target size
    let targetPreviewSize;
    if (targetCanvasSize) {
      targetPreviewSize = targetCanvasSize;
    }
    else {
      targetPreviewSize = new Vector2(
        targetCanvas.width / dpr,
        targetCanvas.height / dpr
      );
    }

    // resize the WebGL canvas to match the target size
    if (!this.canvasSize.equals(targetPreviewSize)) {
      this.canvasSize = targetPreviewSize;
      this.webGLCanvas.width = this.canvasSize.x;
      this.webGLCanvas.height = this.canvasSize.y;
      this.renderer.setSize(this.canvasSize.x, this.canvasSize.y);
    }

    // clear the 2D canvas no matter what
    targetContext.clearRect(0, 0, targetCanvas.width * dpr,
      targetCanvas.height * dpr);

    // render the mesh
    this.scene.add(mesh);
    this.renderer.render(this.scene, this.camera);
    this.scene.remove(mesh);

    // copy webgl canvas contents
    targetContext.drawImage(this.webGLCanvas, 0, 0,
      targetPreviewSize.x,
      targetPreviewSize.y
    );
  }
}
