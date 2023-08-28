import React, { useState } from "react";
import Link from "next/link";

const NavItems = () => {
  const SWAP = "Swap";
  const POOL = "Pool";
  const STAKE = "Stake";
  const LENDING = "Lending";

  const [navItems, setNavItems] = useState(SWAP);

  function getNavIconClassName(name: string) {
    let className =
      "p-1 px-4 cursor-pointer border-[4px] border-transparent flex items-center";
    className +=
      name === navItems ? " bg-zinc-800 border-zinc-900 rounded-full" : "";
    return className;
  }

  return (
    <div className="bg-zinc-900 h-fit flex items-center justify-around rounded-full mx-6">
      <Link href="/">
        <p
          className={getNavIconClassName(SWAP)}
          onClick={() => setNavItems(SWAP)}
        >
          {SWAP}
        </p>
      </Link>
      <Link href="/pool">
        <p
          className={getNavIconClassName(POOL)}
          onClick={() => setNavItems(POOL)}
        >
          {POOL}
        </p>
      </Link>
      <Link href="/stake">
        <p
          className={getNavIconClassName(STAKE)}
          onClick={() => setNavItems(STAKE)}
        >
          {STAKE}
        </p>
      </Link>
      <Link href="/lending">
        <p
          className={getNavIconClassName(LENDING)}
          onClick={() => setNavItems(LENDING)}
        >
          {LENDING}
        </p>
      </Link>
    </div>
  );
};

export default NavItems;
