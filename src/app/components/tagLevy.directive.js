import helpers from '../utils/helpers';

function TagLevy(AppConstants, DimService) {
    'ngInject';
    return {
        restrict: 'E',
        scope: {
            mos: '=',
            tx: '=',
            mosaics: '='
        },
        template: '',
        transclude: true,
        compile: function(tElement, tAttrs, transclude) {
            return function postLink(scope, element, attrs) {

                function getLevy(d) {
                    if (!scope.mosaics) return undefined;
                    let mosaicName = helpers.mosaicIdToName(d.mosaicId);
                    if (!(mosaicName in scope.mosaics)) {
                        return undefined;
                    }
                    let mosaicDefinitionMetaDataPair = scope.mosaics[mosaicName];
                    return mosaicDefinitionMetaDataPair.mosaicDefinition.levy;
                }
                scope.levy = getLevy(scope.mos);
                scope._DIM = DimService;

                let foo = scope;
                scope.$watch('mosaics', function(nv, ov) {
                    scope.levy = getLevy(scope.mos);

                    let slug = scope.mos.mosaicId.namespaceId + ':' + scope.mos.mosaicId.name;
                    scope.levyDiv = scope._DIM.getDivisibility(slug);
                }, true);

                transclude(scope, function(clone, scope) {
                    element.append(clone);
                });
            };
        }
    }

}

export default TagLevy;