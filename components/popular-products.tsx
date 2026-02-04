import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { toast } from "@/components/ui/use-toast";

const products = [
  {
    id: 1,
    name: "Classic White Tee",
    price: 799,
    image: "/classic-white-t-shirt.png",
    href: "/product/classic-white-tee",
  },
  {
    id: 2,
    name: "Slim Fit Jeans",
    price: 1499,
    image: "/slim-fit-blue-jeans.png",
    href: "/product/slim-fit-jeans",
  },
  {
    id: 3,
    name: "Casual Sneakers",
    price: 2499,
    image: "/casual-white-sneakers.png",
    href: "/product/casual-sneakers",
  },
  {
    id: 4,
    name: "Cotton Boxer Briefs",
    price: 599,
    image: "/placeholder.svg?key=3ffok",
    href: "/product/cotton-boxer-briefs",
  },
  {
    id: 5,
    name: "Patterned Socks",
    price: 399,
    image: "/colorful-patterned-socks.png",
    href: "/product/patterned-socks",
  },
  {
    id: 6,
    name: "Hooded Sweatshirt",
    price: 1799,
    image: "/gray-hooded-sweatshirt.png",
    href: "/product/hooded-sweatshirt",
  },
];

export default function PopularProducts() {
  const { addItem } = useCart();

  return (
    <section className="container px-4">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Popular Products
          </h2>
          <p className="text-muted-foreground">
            Our best-selling items loved by customers
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <Link href={product.href} className="block">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              </Link>
              <CardContent className="p-4">
                <Link href={product.href} className="block">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="mt-1 font-medium">
                    ₹{product.price.toLocaleString("en-IN")}
                  </p>
                </Link>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    addItem({
                      id: String(product.id),
                      name: product.name,
                      price: product.price,
                      image: product.image,
                      quantity: 1,
                    });
                    toast({
                      title: "Added to cart",
                      description: `${product.name} added to cart.`,
                    });
                  }}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <Button variant="outline" className="w-full">
                  Try at Home
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="flex justify-center">
          <Button variant="outline" size="lg">
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
}
