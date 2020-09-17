import {
  Component,
  forwardRef,
  useContext,
  useState,
  useEffect,
  useRef
} from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from 'react-dnd-html5-backend'

import { ControllerContext } from "src/components/controller";

import { moveItemInInventory } from "src/redux/actions/inventory";

import * as itemEntities from "src/entities/items";

import "./item-slot.less";

function getSpriteForItem(item) {
  const { itemName } = item;
  const ItemClass = itemEntities.getItemClass(item);
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
    if (itemSprite.ready) {
      previewRenderer.renderPreview(itemSprite.mesh, canvasEl, canvasCtx);
    }
    else {
      itemSprite.readyPromise.then(() => {
        previewRenderer.renderPreview(itemSprite.mesh, canvasEl, canvasCtx);
      });
    }

  }, [item, width, height]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width,
          height
        }}
        />
      <div className="item-name">{item && item.itemName}</div>
    </>
  );
}

export const ItemBox = forwardRef(({
  item,
  displayHotkey = null,
  extraClasses = null
}, ref) => {
  let className = "item-box";
  if (extraClasses) {
    className = [className, ...extraClasses].join(" ");
  }
  let hotkeyDisplay = null;
  if (displayHotkey) {
    hotkeyDisplay = <div className="hotkey-display">{displayHotkey}</div>;
  }
  return (
    <div className={className} ref={ref}>
      <ItemRenderer item={item} width={40} height={40}/>
      { hotkeyDisplay }
    </div>
  );
});

/**
 * Once cell in an item grid or row
 */
export default function ItemSlot({
  inventoryLocation,
  item,
  displayHotkey = null,
  itemType = "ITEM",
  acceptType = "ITEM",
  onDropItem,
  onDropOut
}) {
  const ref = useRef(null);
  const [{ canDrop, isOver },drop] = useDrop({
    accept: acceptType,
    collect: (monitor) => ({
      canDrop: monitor.canDrop(),
      isOver: monitor.isOver()
    }),
    drop: dropped => ({
      droppedItem: dropped.item,
      draggedFrom: dropped.inventoryLocation,
      draggedTo: inventoryLocation
    })
  });
  const [{ isDragging }, drag] = useDrag({
    item: {
      item,
      inventoryLocation,
      type: itemType
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: (dropResult, monitor) => {
      if (monitor.didDrop()) {
        onDropItem && onDropItem(monitor.getDropResult());
      }
      else {
        onDropOut && onDropOut({ inventoryLocation, item });
      }
    }
  });

  drag(drop(ref));

  const extraClasses = ["interactive"];
  if (isDragging) {
    extraClasses.push("dragging");
  }
  if (canDrop) {
    extraClasses.push("drop-target");
  }
  if (isOver) {
    extraClasses.push("is-over");
  }

  return (
    <ItemBox
      item={item}
      displayHotkey={displayHotkey}
      extraClasses={extraClasses}
      ref={ref}
      />
  );
}
