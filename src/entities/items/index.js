import Medkit from "./medkit";
import Scroll from "./scroll";

function getItemIcon(item) {
  const { itemName, id: itemId } = item;
  switch (itemName) {
    case "Medkit":
      return Medkit.getIcon(item.itemData);
    case "Scroll":
      return Scroll.getIcon(item.itemData);
    default:
      return null;
  }
}

export {
  Medkit,
  Scroll,
  getItemIcon
};
