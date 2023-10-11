"use client";
import React, { useState } from "react";
import Link from "next/link";
import Router from "next/router";

const NavItems = () => {
  const router = Router;
  const navItems = ["Swap", "Pool", "Stake", "Lending", "Faucet"];

  const selectedItem =
    navItems.find(
      item =>
        router.pathname === (item === "Swap" ? "/" : `/${item.toLowerCase()}`)
    ) || "Swap";

  const getNavIconClassName = (name: string) => {
    const baseClassName =
      "p-1 px-4 cursor-pointer border-[4px] border-transparent flex items-center";
    return `${baseClassName} ${
      selectedItem === name
        ? "bg-zinc-800 w-[100px] justify-center border-zinc-900 rounded-full"
        : ""
    }`;
  };

  return (
    <div className="bg-zinc-900 h-[50px] lg:w-[600px] flex items-center justify-between rounded-full mx-auto">
      {navItems.map(item => (
        <Link
          key={item}
          href={item === "Swap" ? "/" : `/${item.toLowerCase()}`}
        >
          <div className={getNavIconClassName(item)}>{item}</div>
        </Link>
      ))}
    </div>
  );
};

export default NavItems;
