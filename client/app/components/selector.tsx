import React, { useEffect, useState } from "react";
import { Dropdown } from "@nextui-org/react";

import {
  USDT,
  USDC,
  ETH,
  WETH,
  LINK,
  DEFAULT_VALUE,
} from "../../utils/SupportedCoins";

const Selector = ({ defaultValue, ignoreValue, setToken, id }) => {
  const menu = [
    { key: ETH, name: ETH },
    { key: WETH, name: WETH },
    { key: USDT, name: USDT },
    { key: USDC, name: USDC },
    { key: LINK, name: LINK },
  ];

  const [selectedItem, setSelectedItem] = useState();
  const [menuItems, setMenuItems] = useState();
  return <div>Selector</div>;
};

export default Selector;
