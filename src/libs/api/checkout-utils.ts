interface CheckoutMetadataInput {
    name: string;
    source: string;
    purchaseKind: string;
    companyName?: string | undefined;
    addressLine1?: string | undefined;
    addressLine2?: string | undefined;
    city?: string | undefined;
    postalCode?: string | undefined;
    country?: string | undefined;
}

export function buildCheckoutMetadata(
    input: CheckoutMetadataInput,
): Record<string, string> {
    const base: Record<string, string> = {
        customerName: input.name,
        source: input.source,
    };

    if (input.purchaseKind === 'company') {
        return {
            ...base,
            purchaseKind: 'company',
            companyName: input.companyName ?? '',
            addressLine1: input.addressLine1 ?? '',
            addressLine2: input.addressLine2 ?? '',
            city: input.city ?? '',
            postalCode: input.postalCode ?? '',
            country: input.country ?? '',
        };
    }

    return { ...base, purchaseKind: 'personal' };
}
