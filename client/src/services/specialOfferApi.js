import { API } from "./apis";

const SPECIAL_OFFERS_LIMIT = 4;

const SPECIAL_OFFER_TAB_CONFIG = {
    all: { endpoint: "/special-offers" },
    productRequest: {
        endpoint: "/special-offers/requested-products",
        fallbackItemType: "RequestedProduct",
    },
    productOffer: {
        endpoint: "/special-offers/products",
        fallbackItemType: "Product",
    },
    serviceRequest: {
        endpoint: "/special-offers/service-requests",
        fallbackItemType: "ServiceRequest",
    },
    serviceOffer: {
        endpoint: "/special-offers/services",
        fallbackItemType: "Service",
    },
};

const normalizePaginationParams = (page, limit) => ({
    page: Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1,
    limit:
        Number.isFinite(Number(limit)) && Number(limit) > 0
            ? Number(limit)
            : SPECIAL_OFFERS_LIMIT,
});

const getSpecialOffers = async ({
    tab = "all",
    page = 1,
    limit = SPECIAL_OFFERS_LIMIT,
    q,
    category,
    location,
    providerName,
    type,
    locationPreference,
    startDate,
    startTime,
} = {}) => {
    const tabConfig =
        SPECIAL_OFFER_TAB_CONFIG[tab] || SPECIAL_OFFER_TAB_CONFIG.all;
    const paginationParams = normalizePaginationParams(page, limit);
    
    const params = {
        ...paginationParams,
        tab,
        q,
        category,
        location,
        providerName,
        type,
        locationPreference,
        startDate,
        startTime,
    };

    // Remove undefined params
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

    try {
        return await API.get(tabConfig.endpoint, { params });
    } catch (error) {
        // Fallback keeps compatibility with servers that only support /special-offers?itemType=
        const shouldUseFallback =
            error?.response?.status === 404 && Boolean(tabConfig.fallbackItemType);

        if (!shouldUseFallback) {
            throw error;
        }

        return API.get("/special-offers", {
            params: {
                ...params,
                itemType: tabConfig.fallbackItemType,
            },
        });
    }
};

const toggleSpecialOfferStatus = async (id, status) => {
    return await API.patch(`/special-offers/${id}/toggle`, { status });
};

export const specialOfferApi = {
    getSpecialOffers,
    toggleSpecialOfferStatus,
    SPECIAL_OFFERS_LIMIT,
};
