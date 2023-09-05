"use client";
import { Fragment, useState, useEffect } from "react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/solid";
import { Dialog, Listbox, Transition } from "@headlessui/react";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import { Contract, ethers } from "ethers";
import {
  Button,
  Input,
  Modal,
  Text,
  useModal,
  Dropdown,
} from "@nextui-org/react";
import {
  addLiquidity,
  addLiquidityETH,
  removeLiquidity,
  removeLiquidityETH,
  getLiquidity,
} from "@/utils/queries";
import {
  CONTRACTS,
  tokens,
  TokenProps,
  DEFAULT_VALUE,
  pathLINK_USDC,
  pathLINK_USDT,
  pathLINK_WETH,
  pathUSDC_LINK,
  pathUSDC_USDT,
  pathUSDC_WETH,
  pathUSDT_LINK,
  pathUSDT_USDC,
  pathUSDT_WETH,
  pathWETH_LINK,
  pathWETH_USDC,
  pathWETH_USDT,
} from "../constants/constants";
import Selector from "../components/selector";

const token1 = tokens;
const token2 = tokens;

const Pool = () => {
  const [toggleRemove, setToggleRemove] = useState<boolean>(false);
  const [expand, setExpand] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [toggle, setToggle] = useState<boolean>(false);
  const [selectedToken1, setSelectedToken1] = useState<string>("ETH");
  const [selectedToken2, setSelectedToken2] = useState<string>("USDC");
  const [txPending, setTxPending] = useState<boolean>(false);
  const [selected, setSelected] = useState([...tokens]);
  const [desiredAmountA, setDesiredAmountA] = useState<number>(0);
  const [desiredAmountB, setDesiredAmountB] = useState<number>(0);
  const [liquidity, setLiquidity] = useState<string>("0");
  const [positions, setPositions] = useState<any[]>([]);
  const [reserveA, setReserveA] = useState<number>(0);
  const [reserveB, setReserveB] = useState<number>(0);

  const { address } = useAccount();
  const provider = useProvider();
  const { data: signer } = useSigner();

  // get pair path
  function getPathForTokenToETH(srcToken: string): string[] | null {
    // define a mapping of token addresses to their respective paths to ETH
    const tokenToETHPaths = {
      [CONTRACTS.USDT.address]: pathUSDT_WETH,
      [CONTRACTS.USDC.address]: pathUSDC_WETH,
      [CONTRACTS.LINK.address]: pathLINK_WETH,
    };

    // Check if a path exists for the given source token
    if (srcToken in tokenToETHPaths) {
      return tokenToETHPaths[srcToken];
    }

    return null;
  }

  function getPathForTokensToTokens(
    srcToken: string,
    destToken: string
  ): string[] | null {
    const tokenPairsToPath = {
      [`${CONTRACTS.USDT.address}-${CONTRACTS.USDC.address}`]: pathUSDT_USDC,
      [`${CONTRACTS.USDT.address}-${CONTRACTS.LINK.address}`]: pathUSDT_LINK,
      [`${CONTRACTS.USDC.address}-${CONTRACTS.USDT.address}`]: pathUSDC_USDT,
      [`${CONTRACTS.USDC.address}-${CONTRACTS.LINK.address}`]: pathUSDC_LINK,
      [`${CONTRACTS.LINK.address}-${CONTRACTS.USDT.address}`]: pathLINK_USDT,
      [`${CONTRACTS.LINK.address}-${CONTRACTS.USDC.address}`]: pathLINK_USDC,
    };

    const tokenPairKey = `${srcToken}-${destToken}`;

    if (tokenPairKey in tokenPairsToPath) {
      return tokenPairsToPath[tokenPairKey];
    }

    return null;
  }

  function getPathForETHToToken(destToken: string): string[] | null {
    const ETHToTokenPaths = {
      [CONTRACTS.USDT.address]: pathWETH_USDT,
      [CONTRACTS.USDC.address]: pathWETH_USDC,
      [CONTRACTS.LINK.address]: pathWETH_LINK,
    };

    if (destToken in ETHToTokenPaths) {
      return ETHToTokenPaths[destToken];
    }

    return null;
  }

  const getPositions = async (id: string) => {
    try {
      const promises = [];

      const paths = [
        pathLINK_USDC,
        pathLINK_USDT,
        pathLINK_WETH,
        pathUSDC_LINK,
        pathUSDC_USDT,
        pathUSDC_WETH,
        pathUSDT_LINK,
        pathUSDT_USDC,
        pathUSDT_WETH,
        pathWETH_LINK,
        pathWETH_USDC,
        pathWETH_USDT,
      ];

      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        const tokenA = path[0];
        const tokenB = path[path.length - 1];
        const balance = await getLiquidity(tokenA, tokenB);
        promises.push({ liquidity: balance, pair: { tokenA, tokenB } });
      }

      const positions = await Promise.all(promises);

      setPositions(positions);
    } catch (e) {
      console.log(e);
    }
  };

  const handleModal = () => setExpand(true);
  const closeModal = () => setExpand(false);

  const newPool = () => {
    setToggle(!toggle);
  };
  return (
    <>
      <div className="w-full mt-10 flex flex-col justify-center items-center px-2">
        <div className="w-full flex justify-around">
          <h1 className="text-zinc-300 text-3xl font-semibold">Pools</h1>
          <Button auto onPress={handleModal}>
            + New Pool
          </Button>
          <Modal
            closeButton
            blur
            aria-labelledby="modal-title"
            open={expand}
            onClose={closeModal}
            width="600px"
            css={{
              backgroundColor: "#212429",
            }}
          >
            <Modal.Header>
              <Text
                size={20}
                css={{
                  color: "#fff",
                }}
              >
                Deposit Amounts
              </Text>
            </Modal.Header>
            <Modal.Header>
              <Text
                size={20}
                css={{
                  color: "#fff",
                }}
              >
                Select Pair
              </Text>
            </Modal.Header>
            <Modal.Body>
              <div className="bg-[#212429] p-4 py-2 rounded-xl mb-2 border-[2px] border-transparent hover:border-zinc-600">
                <div className="flex  items-center rounded-xl">
                  <input
                    className="relative text-white  w-full outline-none rounded-xl h-12 px-2 appearance-none text-xl bg-[#2c2f36]"
                    type="number"
                    placeholder="0.0"
                    onChange={e => setDesiredAmountA(Number(e.target.value))}
                  />
                  <div className="absolute right-10  ">
                    <Selector
                      id={"token1"}
                      setToken={setSelectedToken1}
                      defaultValue={selectedToken1}
                      ignoreValue={selectedToken2}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-[#212429] p-4 py-2 rounded-xl mb-2 border-[2px] border-transparent hover:border-zinc-600">
                <div className="flex  items-center rounded-xl">
                  <input
                    className="relative text-white w-full outline-none rounded-xl h-12 px-2 appearance-none text-xl bg-[#2c2f36]"
                    type="number"
                    placeholder="0.0"
                    onChange={e => setDesiredAmountB(Number(e.target.value))}
                  />
                  <div className="absolute right-10 ">
                    <Selector
                      id={"token2"}
                      setToken={setSelectedToken2}
                      defaultValue={selectedToken2}
                      ignoreValue={selectedToken1}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-center py-3">
                <Button>Add Liquidity</Button>
              </div>
            </Modal.Body>
          </Modal>
        </div>
      </div>

      <div className="w-full flex justify-center items-start px-2">
        <div className="overflow-x-auto relative w-full lg:w-7/12 rounded-md mx-auto text-white px-0 py-0 bg-[#212429] opacity-100 backdrop-blur-lg items-center justify-center mt-12 mb-32">
          <h2 className="rounded-t-md text-xl font-semibold tracking-wide w-full  py-4 px-4 border-b border-gray-400">
            Your Liquidity Positions
          </h2>
          <div className="lg:px-4 py-8 w-full">
            <table className="w-full text-sm text-left text-gray-100">
              <thead className="text-sm uppercase text-gray-100 border-b border-gray-500">
                <tr>
                  <th scope="col" className="py-3 px-6">
                    Token A
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Token B
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Liquidity Balance
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Remove Liquidity
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b h-28 border-gray-500 text-gray-100">
                  <th
                    scope="row"
                    className="py-4 px-6 font-medium whitespace-nowrap"
                  >
                    "tokenpairA"
                  </th>
                  <td className="py-4 px-6">"tokenPairB"</td>
                  <td className="py-4 px-6">"liquidityBalance"</td>
                  <td className="py-4 px-6">
                    <Input
                      type="number"
                      className={`
                ${toggleRemove ? `visible` : `hidden`}
               mb-3 ml-1 justify-center items-center
                innerWrapper: "bg-transparent"
              `}
                      placeholder="0"
                      required
                      onChange={e => setLiquidity(e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (toggleRemove) {
                          // handleRemoveLiquidity
                        } else {
                          setToggleRemove(!toggleRemove);
                        }
                      }}
                    >
                      Remove Liquidity
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pool;
