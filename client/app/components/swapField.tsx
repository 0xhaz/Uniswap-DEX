import React from "react";
import Selector from "./selector";
import { tokens, TokenProps } from "../constants/constants";

interface SwapFieldProps {
  obj: {
    id: string;
    value: string;
    setValue: (value: string) => void;
    defaultValue: string;
    setToken: (token: string) => void;
    ignoreValue: string;
    exactAmountIn: string;
    setExactAmountIn: (value: string) => void;
  };
}

const SwapField = React.forwardRef<HTMLInputElement, SwapFieldProps>(
  ({ obj }, ref) => {
    const {
      id,
      value = "",
      setValue,
      defaultValue,
      setToken,
      ignoreValue,
      exactAmountIn,
      setExactAmountIn,
    } = obj;

    const defaultTokenProps = tokens.find(token => token.key === defaultValue);

    return (
      <div className="flex items-center rounded-xl">
        <input
          ref={ref}
          className={getInputClassname()}
          type={"number"}
          value={exactAmountIn}
          placeholder={"0.0"}
          onChange={e => {
            setExactAmountIn(e.target.value);
            setValue(e.target.value);
          }}
        />

        <Selector
          id={id}
          setToken={(token: TokenProps) => setToken(token.key)}
          defaultValue={defaultTokenProps || null}
          ignoreValue={ignoreValue}
          tokens={tokens}
        />
      </div>
    );

    function getInputClassname() {
      let className =
        " w-full outline-none h-8 px-2 appearance-none text-3xl bg-transparent";
      return className;
    }
  }
);

export default SwapField;
