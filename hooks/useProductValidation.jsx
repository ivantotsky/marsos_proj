import { toast } from "sonner";

export default function useProductValidation() {
  const validateProduct = ({
    productNameEn,
    productNameAr,
    productDescriptionEn,
    productDescriptionAr,
    selectedCategory,
    selectedSubCategory,
    mainImageFile,
    priceTiers,
  }) => {
    if (!productNameEn || !productDescriptionEn) {
      toast.error("Product name and description (English) are required.");
      return false;
    }

    if (!productNameAr || !productDescriptionAr) {
      toast.error("اسم المنتج ووصفه (بالعربية) مطلوبة.");
      return false;
    }

    if (!selectedCategory || !selectedCategory.value) {
      toast.error("Please select a category.");
      return false;
    }

    if (!mainImageFile) {
      toast.error("Please upload a main product image.");
      return false;
    }

    if (!priceTiers.length) {
      toast.error("Please add at least one price tier.");
      return false;
    }

    for (const [i, tier] of priceTiers.entries()) {
      if (!tier.minQty?.value || !tier.maxQty?.value || !tier.price?.value) {
        toast.error(
          `Price Tier #${i + 1} is missing quantity or price values.`
        );
        return false;
      }

      if (!tier.deliveryLocations.length) {
        toast.error(
          `Price Tier #${i + 1} must have at least one delivery location.`
        );
        return false;
      }

      for (const [j, loc] of tier.deliveryLocations.entries()) {
        if (!loc.location?.value || !loc.price?.value) {
          toast.error(`Tier #${i + 1} > Location #${j + 1} is incomplete.`);
          return false;
        }
      }
    }

    return true;
  };

  return { validateProduct };
}
