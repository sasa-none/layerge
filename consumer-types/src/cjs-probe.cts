// CJS 解決（require 条件 → .d.cts）の確認用
import {createLayergeRouter, LayergeView, useLayerge} from 'layerge';

export type Probe = {
    createLayergeRouter: typeof createLayergeRouter;
    LayergeView: typeof LayergeView;
    useLayerge: typeof useLayerge;
};
