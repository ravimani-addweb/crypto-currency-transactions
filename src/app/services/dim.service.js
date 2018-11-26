import Network from '../utils/Network';
import convert from '../utils/convert';
import KeyPair from '../utils/KeyPair';
import CryptoHelpers from '../utils/CryptoHelpers';
import Serialization from '../utils/Serialization';
import helpers from '../utils/helpers';
import Address from '../utils/Address';
import TransactionTypes from '../utils/TransactionTypes';

/** Service to work with the DIM Ecosystem */
class DimService {

    /**
     * Initialize services and properties
     *
     * @param {service} Wallet - The Wallet service
     * @param {service} $http - The angular $http service
     * @param {service} DataBridge - The DataBridge service
     * @param {service} NetworkRequests - The NetworkRequests service
     */
    constructor(Wallet, $http, DataBridge, NetworkRequests, $filter) {
        'ngInject';

        /***
         * Declare services
         */
        this._Wallet = Wallet
        this._$http = $http;
        this._DataBridge = DataBridge;
        this._NetworkRequests = NetworkRequests;
        this._$filter = $filter;

        this.defaults = {
            "icon": "/images/dim-currencies.png",
            "priceUsd": 0.00,
            "slug": "nem:xem",
            "label": "XEM",
            "mosaicId": {namespaceId: "nem", name: "xem"},
            "divisibility": 6
        };

        this.currencies = {
            "nem:xem": {
                "icon": "/images/nem.png", "slug": "nem:xem", "label": "XEM",
                "mosaicId": {namespaceId: "nem", name: "xem"}, "divisibility": 6},
            "dim:coin": {
                "icon": "/images/dimcoin.png", "slug": "dim:coin", "priceUsd": 0.04, "label": "DIMCOIN",
                "mosaicId": {namespaceId: "dim", name: "coin"}, "divisibility": 6},
            "dim:token": {
                "icon": "/images/dim-token.png", "slug": "dim:token", "priceUsd": 1.00, "label": "DIM TOKEN",
                "mosaicId": {namespaceId: "dim", name: "token"}, "divisibility": 6},
            "dim:eur": {
                "icon": "/images/dim-euro.png", "slug": "dim:eur", "priceUsd": 1.00, "label": "DIM EURO",
                "mosaicId": {namespaceId: "dim", name: "eur"}, "divisibility": 2},
            "dim:usd": {
                "icon": "/images/dim-usd.png", "slug": "dim:usd", "priceUsd": 1.00, "label": "DIM USD",
                "mosaicId": {namespaceId: "dim", name: "usd"}, "divisibility": 2}
        };
    }

    /**
     * Get the preconfigured currency data
     * 
     * @see this.currencies
     * @param {object} mosaic
     * @return {object}
     */
    getCurrencyConfig(mosaic) {

        var slug = mosaic.mosaicId ? mosaic.mosaicId.namespaceId + ":" + mosaic.mosaicId.name : null;
        if (!slug && mosaic.id) {
            slug = mosaic.id.namespaceId + ":" + mosaic.id.name;
        }
        else if (!slug && mosaic.match && mosaic.match(/[a-z0-9\-_]+:[a-z0-9\-_]+/)) {
            slug = mosaic;
        }

        if (!slug)
            return this.defaults;

        if (! this.currencies.hasOwnProperty(slug)) {
            // currency is not pre-configured (unknown)
            let ns = slug.split(":")[0],
                mos = slug.split(":")[1];

            this.defaults.slug = slug;
            this.defaults.label = ns.toUpperCase() + " " + mos.toUpperCase();
            this.defaults.mosaicId = {namespaceId: ns, name: mos};

            return this.defaults;
        }

        // currency is pre-configured in this service
        return this.currencies[slug];
    }

    /**
     * This method will return preconfigured Icons for given 
     * mosaics on the NEM blockchain.
     * 
     * @param {MosaicMetaDataPair} mosaic 
     * @return {String}
     */
    getCurrencyIcon(mosaic) {
        var spec = this.getCurrencyConfig(mosaic);
        return spec.icon;
    }

    /**
     * This method will return preconfigured *prices* for given 
     * mosaics on the NEM blockchain.
     * 
     * If no preconfigured price is found, the `mosaic.price`
     * property will be used.
     * 
     * @param {object} mosaic 
     * @return {string}
     */
    getCurrencyPrice(mosaic) {
        var spec = this.getCurrencyConfig(mosaic);
        if (spec.priceUsd)
            return spec.priceUsd;

        if (spec.slug == 'nem:xem') {
            // XEM price can be retrieved using data bridge
            var market = this._DataBridge.marketInfo ? this._DataBridge.marketInfo.last : 0;
            var btcUsd = this._DataBridge.btcPrice ? this._DataBridge.btcPrice.last : 0;
            return market * btcUsd;
        }

        return mosaic.price ? mosaic.price : 0.00;
    }

    /**
     * This method will return either the preconfigured label
     * for the given mosaic or the slug of it if it is not 
     * preconfigured.
     * 
     * @param {*} mosaic 
     */
    getCurrencyLabel(mosaic) {
        var spec = this.getCurrencyConfig(mosaic);
        if (spec.slug === "dim:coin")
            return "DIMCOIN";

        return spec.label.length ? spec.label : spec.slug;
    }

    /**
     * get a mosaic `slug` (nem:xem, dim:coin) divisibility
     * on the NEM network. Pre-Configuration of currencies
     * through `this.currencies` is also precedent here.
     * 
     * 0 will be returned in case the divisibility cannot be
     * retrieved from the `this._DataBridge` service.
     * 
     * @param {integer} slug 
     */
    getDivisibility(slug) {
        if (this.currencies.hasOwnProperty(slug))
            return this.currencies[slug].divisibility;

        // need to get divisibility from mosaic MDP
        let props = [];
        if (this._DataBridge.mosaicDefinitionMetaDataPairSize > 0 
            && this._DataBridge.mosaicDefinitionMetaDataPair[slug].properties 
            && this._DataBridge.mosaicDefinitionMetaDataPair[slug].properties.length)
            props = this._DataBridge.mosaicDefinitionMetaDataPair[slug].properties;

        for (let i = 0; i < props.length; i++) {
            if (props[i].name === "divisibility")
                return props[i].value;
        }

        return 0;
    }

    /**
     * Return boolean whether passed `mosaic` 
     * can be *bought* using the exchange or 
     * assetExplorer.
     * 
     * @param {object} mosaic 
     * @return {boolean}
     */
    canBuyCurrency(mosaic) {
        var spec = this.getCurrencyConfig(mosaic);
        if (spec.slug === "dim:coin")
            return true;

        return false;
    }

    /**
     * Return boolean whether passed `mosaic`
     * can be *sold* using transfers.
     * 
     * @param {object} mosaic 
     * @return {string}
     */
    canSellCurrency(mosaic) {
        var spec = this.getCurrencyConfig(mosaic);
        var authorized = {
            "dim:coin": true,
            "dim:token": true
        };

        return authorized.hasOwnProperty(spec.slug);
    }

    /**
     * Return boolean whether passed `mosaic`
     * can be *transferred*.
     * 
     * @param {object} mosaic 
     * @return {string}
     */
    canTransferCurrency(mosaic) {
        //XXX implement mosaicDefinitionPair retrieval
        //XXX for non-transferable mosaics.

        return true;
    }
}

export default DimService;