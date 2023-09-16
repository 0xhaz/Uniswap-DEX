import React from "react";
import Selector from "./selector";
import { tokens, TokenProps } from "../constants/constants";

interface SwapFieldProps {
  id: string;
  value: string;
  setValue: (value: string) => void;
  defaultValue: string;
  setToken: (token: string) => void;
  ignoreValue: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SwapField = ({
  value = "",
  setValue,
  defaultValue,
  setToken,
  ignoreValue,
  handleChange,
}: SwapFieldProps) => {
  const defaultTokenProps = tokens.find(token => token.key === defaultValue);

  return (
    <div className="flex items-center rounded-xl">
      <input
        className="w-full outline-none h-8 px-2 appearance-none text-3xl bg-transparent"
        type={"number"}
        value={value}
        placeholder={"0.0"}
        onChange={handleChange}
      />

      <Selector
        id={"swap"}
        setToken={(token: TokenProps) => setToken(token.key)}
        defaultValue={defaultTokenProps || null}
        ignoreValue={ignoreValue}
        tokens={tokens}
      />
    </div>
  );
};

export default SwapField;
