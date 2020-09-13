import {
  Component,
  useContext,
  useState,
  useEffect,
  useRef
} from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from 'react-dnd-html5-backend'

import { ControllerContext } from "src/components/controller";

import * as itemEntities from "src/entities/items";

function getSpriteForItem(item) {
  const { itemName } = item;
  const ItemClass = itemEntities[itemName];
  if (!ItemClass) {
    throw new Error("missing item definition");
  }
  return ItemClass.getIcon();
}

/**
 * Item renderer - renders one cell in an item grid
 */
export function ItemRenderer({
  item,
  width = 40,
  height = 40
}) {
  // get a handle on the item preview renderer
  const { previewRenderer } = useContext(ControllerContext);

  // set up refs
  const canvasRef = useRef();
  const canvasContextRef = useRef();

  // rendering logic
  useEffect(() => {
    // get canvas and 2D context
    const dpr = window.devicePixelRatio;
    const canvasEl = canvasRef.current;
    let canvasCtx = canvasContextRef.current;
    if (!canvasCtx) {
      canvasEl.width = dpr * width;
      canvasEl.height = dpr * height;
      canvasCtx = canvasEl.getContext("2d");
      canvasCtx.scale(dpr, dpr);
      canvasContextRef.current = canvasCtx;
    }

    // no item - no problem
    if (!item || !item.itemName) {
      canvasCtx.clearRect(0, 0, canvasEl.width * dpr, canvasEl.height * dpr);
      return;
    }

    // get the current sprite
    let itemSprite;
    try {
      itemSprite = getSpriteForItem(item);
    }
    catch (err) {
      if (err.message === "missing item definition") {
        return;
      }
    }

    // queue up a render
    itemSprite.readyPromise.then(() => {
      previewRenderer.renderPreview(itemSprite.mesh, canvasEl, canvasCtx);
    });

  }, [item, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width,
        height
      }}
      />
  );
}

/**
 * Once cell in an item grid
 */
export default function ItemSlot({
  hotkey = null,
  inventorySlot,

}) {

}
