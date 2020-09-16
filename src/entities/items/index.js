import Medkit from "./medkit";
import Scroll from "./scroll";

function getItemClass(item) {
  const { itemName, id: itemId } = item;
  switch (itemName) {
    case "Medkit":
      return Medkit;
    case "Scroll":
      return Scroll;
    default:
      return null;
  }
}

export {
  Medkit,
  Scroll,
  getItemClass
};
