import { createContext, ReactNode, useContext, useState } from "react";
import 'react-toastify/dist/ReactToastify.css';
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

  const addProduct = async (productId: number) => {
    try {
      // TODO

      // Verificar o estoque atual do produto
      const amountStock:number = await checkStock(productId)

      // Verificar se o produto já está no carrinho
      const storagedCart = localStorage.getItem("@RocketShoes:cart");

      if (storagedCart) {
        const arrayStoraged: Product[] = JSON.parse(storagedCart);

        const filtered: Product[] = arrayStoraged.filter(
          (product) => product.id === productId
        );

        if (filtered.length > 0) {
          if ((filtered[0].amount +1 ) > amountStock ) return

          await updateProductAmount({
            productId,
            amount: 1,
          });
        } else {
          await api.get<Product>(`products/${productId}`).then((response) => {
            setCart([
              ...cart,
              {
                id: response.data.id,
                image: response.data.image,
                price: response.data.price,
                title: response.data.title,
                amount: 1,
              },
            ]);
            localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
          });
        }
      } else {
        // Cart is empty
        console.log(`cart is empty`);
        await api.get<Product>(`products/${productId}`).then((response) => {
          setCart([
            ...cart,
            {
              id: response.data.id,
              image: response.data.image,
              price: response.data.price,
              title: response.data.title,
              amount: 1,
            },
          ]);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
        });
      }
    } catch {
      // TODO
    }
  };

  const removeProduct = (productId: number) => {
    console.log(`removeProduct ${productId}`);
    try {
      // TODO
      const filtered = cart.filter((product) => product.id !== productId);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(filtered));
      setCart(filtered);
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      const updated = cart.map((product) => {
        if (product.id === productId) {
          return {
            ...product,
            amount: product.amount + amount,
          };
        } else {
          return product;
        }
      });
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updated));
      setCart(updated);
    } catch {
      // TODO
    }
  };

  async function checkStock(productId: number): Promise<number> {
    let amountStock = 0
    await api
      .get(`stock/${productId}`)
      .then((response) => amountStock =response.data.amount);
    return amountStock
  };

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
