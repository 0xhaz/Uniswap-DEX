"use client";
import React, { useState } from "react";
import Link from "next/link";

const NavItems = () => {
  const navItems = ["Swap", "Pool", "Stake", "Lending", "Faucet"];

  const [selectedItem, setSelectedItem] = useState("Swap");

  function getNavIconClassName(name: string) {
    const baseClassName =
      "p-1 px-4 cursor-pointer border-[4px] border-transparent flex items-center";
    return `${baseClassName} ${
      selectedItem === name
        ? "border-zinc-800 w-[100px] justify-center border-zinc-900 rounded-full"
        : ""
    }`;
  }

  const handleItemClick = (name: string) => {
    setSelectedItem(name);
  };

  return (
    <div className="bg-zinc-900 h-[50px] lg:w-[600px] flex items-center justify-between rounded-full mx-auto">
      {navItems.map(item => (
        <Link key={item} href={`/${item.toLowerCase()}`}>
          <div
            className={getNavIconClassName(item)}
            onClick={() => handleItemClick(item)}
          >
            {item}
          </div>
        </Link>
      ))}
    </div>
  );
};

export default NavItems;
