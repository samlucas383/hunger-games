import * as React from "react";
import off from "../../off";
import { ROBOTOFF_API_URL } from "../../const";

const imagesToRead = [
  {
    tagtype: "states",
    tag_contains: "contains",
    tag: "en:ingredients-to-be-completed",
  },
  {
    tagtype: "states",
    tag_contains: "contains",
    tag: "en:ingredients-photo-selected",
  },
];

const getImageUrl = (
  base: string,
  id: string,
  resolution: "100" | "400" | "full",
) => {
  return `${base}${id}${resolution === "full" ? "" : `.${resolution}`}.jpg`;
};

const getIngredientExtractionUrl = (base: string, id: string) => {
  return `${ROBOTOFF_API_URL}/predict/ingredient_list?ocr_url=${base}${id}.json`;
};

type ImageData = {
  imgid?: string;
  geometry?: string;
  sizes?: {
    full?: {
      w?: number | string;
      h?: number | string;
    };
  };
  uploaded_t?: number;
  uploader?: string;
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
};

type ImagesMap = Record<string, ImageData>;

type SelectedImage = {
  imgId: string;
  countryCode: string;
  imageUrl: string;
  fetchDataUrl: string;
  uploaded_t?: number;
  uploader?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
  geometry?: string;
};

const formatData = ({
  code,
  lang,
  image_ingredients_url,
  product_name,
  ingredient,
  images,
  scans_n,
  ...other
}: {
  code: string;
  lang: string;
  image_ingredients_url: string;
  product_name: string;
  ingredient: unknown;
  images?: ImagesMap;
  scans_n: unknown;
  [x: string]: unknown;
}) => {
  const baseImageUrl = image_ingredients_url.replace(/ingredients.*/, "");
  const imageMap = images ?? {};

  const selectedImages = Object.keys(imageMap)
    .filter((key) => key.startsWith("ingredients"))
    .map<SelectedImage | null>((key) => {
      const imageData = imageMap[key];
      if (!imageData?.imgid || !imageData.geometry) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, x = "0", y = "0"] = imageData.geometry.split("-");

      const countryCode = key.startsWith("ingredients_")
        ? key.slice("ingredients_".length)
        : "";

      const { uploaded_t, uploader } = imageMap[imageData.imgid] ?? {};
      return {
        imgId: imageData.imgid,
        countryCode,
        imageUrl: getImageUrl(baseImageUrl, imageData.imgid, "full"),
        fetchDataUrl: getIngredientExtractionUrl(
          baseImageUrl.replace("images.", "static."),
          imageData.imgid,
        ),
        uploaded_t,
        uploader,
        x: Number.parseFloat(x),
        y: Number.parseFloat(y),
        w: Number.parseFloat(String(imageData.sizes?.full?.w ?? 0)),
        h: Number.parseFloat(String(imageData.sizes?.full?.h ?? 0)),
        x1: imageData.x1,
        x2: imageData.x2,
        y1: imageData.y1,
        y2: imageData.y2,
        geometry: imageData.geometry,
      };
    })
    .filter((item): item is SelectedImage => item !== null);
  const ingredientTexts: Record<string, unknown> = {};
  Object.entries(other).forEach(([key, value]) => {
    if (key.startsWith("ingredient")) {
      ingredientTexts[key] = value;
    }
  });
  return {
    code,
    lang,
    selectedImages,
    image_ingredients_url,
    product_name,
    ingredient,
    scans_n,
    ...ingredientTexts,
    // images,
  };
};

type FormattedProduct = ReturnType<typeof formatData>;

export default function useData(
  countryCode: string,
): [FormattedProduct[], () => void, boolean] {
  const [data, setData] = React.useState<FormattedProduct[]>([]);
  const prevCountry = React.useRef(countryCode);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(() => {
    return 0;
    // Seems that API fails for large page number
    //return new Date().getMilliseconds() % 50;
  });
  const seenCodes = React.useRef<Record<string, boolean>>({});

  React.useEffect(() => {
    let isValid = true;

    const load = async () => {
      setIsLoading(true);

      try {
        const {
          data: { products },
        } = await off.searchProducts({
          page,
          pageSize: 25,
          filters: imagesToRead,
          fields: "all",
          countryCode: countryCode || "world",
        });
        if (isValid) {
          const rep = products
            .filter((p) => {
              const isNew = !seenCodes.current[p.code]; // prevent from adding products already seen
              if (isNew) {
                seenCodes.current[p.code] = true;
              }

              return isNew;
            })
            .map(formatData);

          if (prevCountry.current !== countryCode) {
            setData(rep);
            prevCountry.current = countryCode;
          } else {
            setData((prev) => [...prev, ...rep]);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.log(error);
      }
    };

    load();
    return () => {
      isValid = false;
    };
  }, [page, countryCode]);

  const removeHead = React.useCallback(() => {
    setData((prev) => [...prev.slice(1)]);
  }, []);

  React.useEffect(() => {
    // This is dummy but will be ok for a PoC
    if (data.length < 5 && !isLoading) {
      setPage((p) => p + 1);
    }
  }, [data, isLoading]);

  return [data, removeHead, isLoading];
}
