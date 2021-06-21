import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [product, setProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const prevCartRef = useRef<Product[]>()

  useEffect(() => {
    prevCartRef.current = cart;
  })

  const cartPreviousValue = prevCartRef.current ?? cart;

  useEffect(() => {
    if (cartPreviousValue !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    }
  }, [cartPreviousValue, cart])

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const updatedCart = [...cart];

      const productExists = updatedCart.find(
        (product) => product.id === productId
      );

      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExists) {
        productExists.amount = amount;
      } else {
        const product = await api.get(`products/${productId}`);
        const newProduct = {
          ...product.data,
          amount: 1,
        };
        updatedCart.push(newProduct);
      }
      console.log(`updatedCart ${JSON.stringify(updatedCart)}`);
      setCart(updatedCart);
      //localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      // TODO
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    console.log(`removeProduct ${productId}`);
    try {
      // TODO
      const updatedCart = [...cart];
      const productIndex = updatedCart.findIndex(
        (product) => product.id === productId
      );
      if (productIndex >= 0) {
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
        //localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else {
        throw Error();
      }
    } catch {
      // TODO
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount <= 0) return;

      const stock = await api.get(`stock/${productId}`);

      const stockAmount = stock.data.amount;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find(
        (product) => product.id === productId
      );
      if (productExists) {
        productExists.amount = amount;
        setCart(updatedCart);
      } else {
        throw Error();
      }
    } catch {
      // TODO
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  async function checkStock(productId: number): Promise<number> {
    let amountStock = 0;
    await api
      .get(`stock/${productId}`)
      .then((response) => (amountStock = response.data.amount));
    return amountStock;
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
