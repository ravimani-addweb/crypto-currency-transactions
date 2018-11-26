const AppConstants = {
    //Application name
    appName: 'DEPOT WALLET',
    version: 'BETA 1.3.63',

    // HYBSE user addresses
    stamps: 'NC3MED-E4RXIC-ET4YI3-IMKBEK-CJOISA-UJITIV-XOMH',
    dimcoin: 'ND4WUI-CO6JUN-MACZ46-NSKIJ5-TEKGFM-CPFTX5-I2Y5',
    dimsell: 'NB3GNK-KOFM2Z-5AEBKF-NWDN2R-FHZ2PJ-UYWEZ7-SK7K',
    hybse: 'NCTEE6-ERYZ3U-I4KSO7-NXX3ZF-VMMZVG-KJFEBZ-EDVQ',

    //Network
    defaultNetwork: 104,

    // Ports
    defaultNisPort: 7891,
    defaultMijinPort: 7895,
    defaultWebsocketPort: 7779,

    // Activate/Deactivate mainnet
    mainnetDisabled: false,

    // Activate/Deactivate mijin
    mijinDisabled: true,
    //Default signup value
    opt: 2,
    //Default languages
    selectOption : {name: "English", key: "en", value: "en"},

    //default external links
    basicWallet_video: 'https://www.youtube.com/watch?v=LopnIUl44Bk',
    basicWallet_pdf: '/resources/depotwallet-first-steps.pdf',
    primiumWallet_video: 'https://www.youtube.com/watch?v=LopnIUl44Bk',
    primiumWallet_pdf: '/resources/depotwallet-first-steps.pdf',

    vipWallet_priseList: '/resources/depotwallet-vip-pricelist.pdf',
    steps_Bip32: 'http://bip32.org/',

    block_chain: 'http://chain.nem.ninja/#/account/',
    block_chain_block: 'http://chain.nem.ninja/#/block/',
    block_chain_hash: 'http://chain.nem.ninja/#/transfer/',
    block_chain_mosaics: 'http://chain.nem.ninja/#/mosaics/',
    // default image
    Bgimage: [
        "assets/pages/media/bg/4.jpg",
        "assets/pages/media/bg/1.jpg",
        "assets/pages/media/bg/4.jpg",
        "assets/pages/media/bg/1.jpg"
    ],
    // Available languages
    languages: [{
            name: "English",
            key: "en",
            value: "en"
    },{
            name: "Chinese",
            key: "zh",
            value: "zh"
    }/*,{
            name: "Polish",
            key: "pl",
            value: "pl"
          },{
            name: "Japanese",
            key: "ja",
            value: "ja"
          }*/,{
            name: "German",
            key: "de",
            value: "de"
          },{
            name: "Russian",
            key: "ru",
            value: "ru"
          },{
            name: "Spanish",
            key: "es",
            value: "es"
          }
    ],

};

export default AppConstants;
