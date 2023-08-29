import React, { use, useEffect, useState } from "react";
import { Dropdown } from "@nextui-org/react";
import Image from "next/image";
import {
  USDT,
  USDC,
  ETH,
  WETH,
  LINK,
  DEFAULT_VALUE,
} from "../../utils/SupportedCoins";
import { tokens } from "../constants/constants";

const Selector = ({ defaultValue, ignoreValue, setToken, id }) => {
  const [selectedItem, setSelectedItem] = useState();
  const [menuItems, setMenuItems] = useState();

  function getFilteredItems(ignoreValue) {
    return tokens.filter(item => item["key"] !== ignoreValue);
  }

  useEffect(() => {
    setSelectedItem(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    setMenuItems(getFilteredItems(ignoreValue));
  }, [ignoreValue]);

  return (
    <>
      <Dropdown>
        <Dropdown.Button
          css={{
            backgroundColor:
              selectedItem === DEFAULT_VALUE ? "#2172e5" : "#2c2f36",
          }}
        >
          {selectedItem}
        </Dropdown.Button>
        <Dropdown.Menu
          aria-label="Dynamic Actions"
          items={menuItems}
          onAction={key => {
            setSelectedItem(key);
            setToken(key);
          }}
        >
          {item => (
            <Dropdown.Item
              aria-label={id}
              key={item.key}
              color={item.key === "delete" ? "error" : "default"}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <Image
                  src={item.logo}
                  alt={item.name}
                  width={20}
                  height={20}
                  style={{ marginRight: "8px" }}
                />
                {item.name}
              </div>
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
};

export default Selector;
