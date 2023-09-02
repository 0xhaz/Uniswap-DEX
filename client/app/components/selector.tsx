import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Dropdown } from "@nextui-org/react";

import { TokenProps, tokens, DEFAULT_VALUE } from "../constants/constants";

interface SelectorProps {
  defaultValue: string;
  ignoreValue: string;
  setToken: (token: string) => void;
  id: string;
}

const Selector = ({
  defaultValue,
  ignoreValue,
  setToken,
  id,
}: SelectorProps) => {
  const [selectedItem, setSelectedItem] = useState<string | number | null>(
    defaultValue
  );
  const [menuItems, setMenuItems] = useState(getFilteredItems(ignoreValue));

  function getFilteredItems(ignoreValue: string) {
    return tokens.filter(item => item["key"] !== ignoreValue);
  }

  useEffect(() => {
    setSelectedItem(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    setMenuItems(getFilteredItems(ignoreValue));
  }, [ignoreValue]);

  return (
    <Dropdown>
      <Dropdown.Button
        css={{
          backgroundColor:
            selectedItem === DEFAULT_VALUE ? "#2172e5" : "#2c2f36",
        }}
      >
        {selectedItem !== DEFAULT_VALUE ? (
          <>
            <Image
              src={
                menuItems.find(item => item.key === selectedItem)?.logo || ""
              }
              alt={selectedItem?.toString() || ""}
              width={20}
              height={20}
              style={{ marginRight: "8px" }}
            />
            <div style={{ display: "flex", marginRight: "8px" }}>
              {selectedItem}
            </div>
          </>
        ) : (
          DEFAULT_VALUE
        )}
      </Dropdown.Button>
      <Dropdown.Menu
        aria-label="Dynamic Actions"
        items={menuItems}
        onAction={key => {
          setSelectedItem(key);
          setToken(key.toString());
        }}
      >
        {menuItems.map(item => (
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
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};
export default Selector;
