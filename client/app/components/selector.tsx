import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Dropdown } from "@nextui-org/react";

import { TokenProps, tokens, DEFAULT_VALUE } from "../constants/constants";

interface SelectorProps {
  defaultValue: string;
  ignoreValue: string;
  setToken: (token: TokenProps) => void;
  id: string;
  tokens?: TokenProps[];
}

const Selector: React.FC<SelectorProps> = ({
  defaultValue,
  ignoreValue,
  setToken,
  id,
  tokens,
}: SelectorProps) => {
  const [selectedItem, setSelectedItem] = useState<string | number | null>(
    defaultValue
  );
  const [menuItems, setMenuItems] = useState(getFilteredItems(ignoreValue));

  const handleTokenChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedToken = tokens?.find(
      token => token.key === event.target.value
    );
    if (selectedToken) {
      setToken(selectedToken);
    }
  };

  function getFilteredItems(ignoreValue: string) {
    return (tokens || []).filter(item => item["key"] !== ignoreValue);
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
        onAction={selectedTokenKey => {
          const selectedToken = menuItems.find(
            item => item.key === selectedTokenKey
          );
          if (selectedToken) {
            setSelectedItem(selectedTokenKey);
            setToken(selectedToken);
          }
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
