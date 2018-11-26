import helpers from '../utils/helpers';
import Network from '../utils/Network';
import CryptoHelpers from '../utils/CryptoHelpers';
import KeyPair from '../utils/KeyPair';
import Address from '../utils/Address';

let incr = 0;

function TagTransaction(NetworkRequests, Alert, Wallet, $filter, Transactions, $timeout, $state, $localStorage, AppConstants, DimService) {
    'ngInject';

    return {
        restrict: 'E',
        scope: {
            d: '=',
            z: '=',
            tooltipPosition: '=',
            accountData: '=',
            h: '='
        },
        template: '<ng-include src="templateUri"/>',
        link: (scope) => {

            // prepare scope transaction data
            scope.tx = scope.d.transaction;
            scope.parent = undefined;
            if (scope.d.transaction.type == 4100) {
                // Multisig Transaction
                scope.tx = scope.d.transaction.otherTrans;
                scope.parent = scope.d.transaction;
                scope.confirmed = !(scope.d.meta.height === Number.MAX_SAFE_INTEGER);
                scope.needsSignature = scope.parent && !scope.confirmed && scope.h.accountData && helpers.needsSignature(scope.d, scope.h.accountData);

                //console.log(scope.parent.signatures, Object.keys(scope.parent.signatures));
            }

            scope.meta = scope.d.meta;
            scope.number = incr++;
            scope.mainAccount = scope.z;
            scope.walletScope = scope.h;
            // end scope transaction data

            scope.blockchain = AppConstants.block_chain;
            scope.blockchain_block= AppConstants.block_chain_block;
            scope.blockchain_hash = AppConstants.block_chain_hash;
            scope.blockchain_mosaics=AppConstants.block_chain_mosaics;

            // If called from the accounts explorer we hide message decryption
            scope.disableDecryption = false;
            if ($state.current.name === 'app.accountsExplorer') {
                scope.disableDecryption = true;
            }

            // configure view
            scope.templateName = helpers.txTypeToName(scope.tx.type);
            scope.templateUri = 'layout/lines/line' + scope.templateName + '.html';

            // prepare NEM related data
            scope.mosaicIdToName = helpers.mosaicIdToName;
            scope.mosaicDefinitionMetaDataPair = scope.walletScope.mosaicDefinitionMetaDataPair;
            scope.cosignCallback = scope.$parent.cosignTransaction;
            scope.displayTransactionDetails = scope.$parent.displayTransactionDetails;
            scope.networkId = Wallet.network;
            scope.walletScope.common = {
                'password': '',
                'privateKey': ''
            }

            scope._DIM = DimService;

            /**
             * decode() Decode an encrypted message in a transaction
             *
             * @param tx: The transaction object
             */
            scope.decode = (tx) => {
                // Check and decrypt/generate private key. Returned private key is contained into scope.walletScope.common
                if (!CryptoHelpers.passwordToPrivatekeyClear(scope.walletScope.common, Wallet.currentAccount, Wallet.algo, true)) {
                    Alert.invalidPassword();
                    return;
                } else if (!CryptoHelpers.checkAddress(scope.walletScope.common.privateKey, Wallet.network, Wallet.currentAccount.address)) {
                    Alert.invalidPassword();
                    return;
                }

                // Get sender account info
                NetworkRequests.getAccountData(helpers.getHostname(Wallet.node), tx.recipient)
                    .then((data) => {
                        // Set right public key if sender or recipient
                        let recipientPubKey;
                        let kp = KeyPair.create(scope.walletScope.common.privateKey);
                        if(kp.publicKey.toString() === tx.signer) {
                            recipientPubKey = data.account.publicKey;
                        } else {
                            recipientPubKey = tx.signer;
                        }
                        if(!recipientPubKey) {
                            Alert.noPublicKeyForDecoding();
                            return;
                        }
                        let decoded = CryptoHelpers.decode(scope.walletScope.common.privateKey, recipientPubKey, tx.message.payload);
                        // Decode the message
                        if (!decoded) {
                            Alert.emptyDecodedMessage();
                        } else {
                            let decryptedMessage = $filter('fmtHexMessage')({
                                "type": 1,
                                "payload": decoded
                            });

                            // Nanowallet exploit FIX
                            // https://forum.nem.io/t/serious-nanowallet-exploit/10224
                            // Fixed since 2017.12.17
                            let sanitized = decryptedMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;");

                            // Set decrypted message in the right template,
                            // use the tx timeStamp to identify each element in the array of templates generated with
                            // ng-repeat and tag-transaction directive.
                            // There is two parts in the template, the line and the details
                            $("#line-" + tx.timeStamp).html(sanitized);
                            $("#details-" + tx.timeStamp).html(sanitized);
                            // Reset common
                            scope.walletScope.common.password = "";
                            scope.walletScope.common.privateKey = "";
                            //remove the the decode part of the template
                            $("#decodeTxMessage-" + tx.timeStamp).remove();
                        }
                    }, (err) => {
                        // Reset common
                        scope.walletScope.common.password = "";
                        scope.walletScope.common.privateKey = "";
                        Alert.getAccountDataError(err.statusText);
                        return;
                    });
            };

            /**
             * cosign() Cosign a multisig transaction
             *
             * @param parentTx: The transaction object
             * @param tx: The inner transaction object
             * @param meta: The meta data of transaction object
             */
            scope.walletScope.cosign = (parentTx, tx, meta) => {
                let txCosignData = {
                    'fee': 0,
                    'multisigAccount': parentTx.otherTrans.signer, // inner tx signer is a multisig account
                    'multisigAccountAddress': Address.toAddress(parentTx.otherTrans.signer, Wallet.network),
                    'hash': meta.innerHash.data // hash of an inner tx is needed
                };

                // Check and decrypt/generate private key. Returned private key is contained into scope.walletScope.common
                if (!CryptoHelpers.passwordToPrivatekeyClear(scope.walletScope.common, Wallet.currentAccount, Wallet.algo, true)) {
                    Alert.invalidPassword();
                    return;
                } else if (!CryptoHelpers.checkAddress(scope.walletScope.common.privateKey, Wallet.network, Wallet.currentAccount.address)) {
                    Alert.invalidPassword();
                    return;
                }

                // Construct transaction byte array, sign and broadcast it to the network
                Transactions.prepareSignature(txCosignData, scope.walletScope.common)
                    .then((res) => {
                        // Check status
                        if (res.status === 200) {
                            // If code >= 2, it's an error
                            if (res.data.code >= 2) {
                                Alert.transactionError(res.data.message);
                            } else {
                                Alert.transactionSignatureSuccess();
                                // update transaction state
                                $timeout(() => {
                                    $("#needsSignature-" + tx.timeStamp).remove();
                                    $("#needsSignature2-" + tx.timeStamp).remove();
                                    parentTx.signatures.push({ "signer": scope.h.accountData.account.publicKey, "timeStamp": helpers.createNEMTimeStamp()});
                                });
                            }
                        }
                        // Reset common
                        scope.walletScope.common.password = "";
                        scope.walletScope.common.privateKey = "";
                    }, (err) => {
                        // Reset common
                        scope.walletScope.common.password = "";
                        scope.walletScope.common.privateKey = "";
                        Alert.transactionError('Failed ' + res.data.error + " " + res.data.message);
                    });
            }

            /**
             * Return contact label for an address
             *
             * @param {string} address - The address to look for
             *
             * @return {string|boolean} - The account label or false
             */
            scope.getContact = (address) => {
                if(undefined !== $localStorage.contacts && undefined !== $localStorage.contacts[Wallet.currentAccount.address]) {
                    let contact = helpers.getContact($localStorage.contacts[Wallet.currentAccount.address], address);
                    if(!contact) {
                        return false;
                    } else {
                        return contact;
                    }
                } else {
                    return false;
                }
            }

            /**
             * Helper to get currency configuration by slug or mosaic data.
             * 
             * @param   {string|object}     currency    Currency slug, NEM mosaic MetaDataPair or NEM mosaic definition
             * @return  {object}
             */
            scope.getCurrency = (currency) => {
                return scope._DIM.getCurrencyConfig(currency);
            }

            /**
             * This will update the lock icon for message decryption
             * in transaction listings where decryption is available.
             */
            scope.triggerMessageDecryption = () => {
                jQuery('input.switched-item').on('change', function() {
                    if (jQuery(this).is(':checked')) {
                        jQuery(this).siblings('.on-off-wrap').addClass('switched-on');
                        jQuery(this).siblings('.on-off-wrap').removeClass('switched-off');
                    } else {
                        jQuery(this).siblings('.on-off-wrap').removeClass('switched-on');
                        jQuery(this).siblings('.on-off-wrap').addClass('switched-off');
                    }
                });
            }
        }
    };
}

export default TagTransaction;
