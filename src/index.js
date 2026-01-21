import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { 
    PanelBody, 
    SelectControl, 
    RangeControl, 
    ToggleControl,
    TextControl,
    FormTokenField,
    RadioControl
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

registerBlockType('gallery/block', {
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps();

        const {
            sourceType,
            galleries,
            categories,
            includeUnpublished,
            layout,
            columns,
            gutter,
            targetHeight,
            maxImages,
            linkToImage,
            linkToPost,
            crop,
            size,
            exifTemplate
        } = attributes;

        // Fetch gallery terms and categories
        const { galleryTerms, categoryTerms, isLoadingGalleries, isLoadingCategories } = useSelect((select) => {
            const { getEntityRecords, isResolving } = select('core');
            
            return {
                galleryTerms: getEntityRecords('taxonomy', 'photo_gallery', { per_page: -1 }) || [],
                categoryTerms: getEntityRecords('taxonomy', 'category', { per_page: -1 }) || [],
                isLoadingGalleries: isResolving('core', 'getEntityRecords', ['taxonomy', 'photo_gallery', { per_page: -1 }]),
                isLoadingCategories: isResolving('core', 'getEntityRecords', ['taxonomy', 'category', { per_page: -1 }])
            };
        }, []);

        // Convert term IDs to names for FormTokenField (Galleries)
        const selectedGalleryNames = galleries
            .map(id => {
                const term = galleryTerms.find(t => t.id === id);
                return term ? term.name : null;
            })
            .filter(Boolean);

        // Convert term IDs to names for FormTokenField (Categories) - limit to 1
        const selectedCategoryNames = categories
            .slice(0, 1) // Only allow one category
            .map(id => {
                const term = categoryTerms.find(t => t.id === id);
                return term ? term.name : null;
            })
            .filter(Boolean);

        // Handle gallery selection
        const onGalleriesChange = (newNames) => {
            const newIds = newNames
                .map(name => {
                    const term = galleryTerms.find(t => t.name === name);
                    return term ? term.id : null;
                })
                .filter(Boolean);
            setAttributes({ galleries: newIds });
        };

        // Handle category selection (limit to 1)
        const onCategoriesChange = (newNames) => {
            const limitedNames = newNames.slice(0, 1); // Only allow one
            const newIds = limitedNames
                .map(name => {
                    const term = categoryTerms.find(t => t.name === name);
                    return term ? term.id : null;
                })
                .filter(Boolean);
            setAttributes({ categories: newIds });
        };

        // Get suggestion lists for FormTokenField
        const gallerySuggestions = galleryTerms.map(term => term.name);
        const categorySuggestions = categoryTerms.map(term => term.name);

        // Handle source type change - clear opposite selection
        const onSourceTypeChange = (newType) => {
            setAttributes({ sourceType: newType });
            if (newType === 'gallery') {
                setAttributes({ categories: [] });
            } else {
                setAttributes({ galleries: [] });
            }
        };

        // Get current selection info for display
        let selectionInfo = '';
        if (sourceType === 'gallery') {
            if (galleries.length > 0) {
                selectionInfo = `${galleries.length} ${galleries.length === 1 ? 'gallery' : 'galleries'} selected: ${selectedGalleryNames.join(', ')}`;
            } else {
                selectionInfo = '⚠️ No galleries selected';
            }
        } else {
            if (categories.length > 0) {
                selectionInfo = `1 category selected: ${selectedCategoryNames[0]}`;
            } else {
                selectionInfo = '⚠️ No category selected';
            }
        }

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('Source Selection', 'gallery-block')} initialOpen={true}>
                        <RadioControl
                            label={__('Image Source', 'gallery-block')}
                            selected={sourceType}
                            options={[
                                { label: __('Gallery Taxonomy', 'gallery-block'), value: 'gallery' },
                                { label: __('Category', 'gallery-block'), value: 'category' }
                            ]}
                            onChange={onSourceTypeChange}
                            help={sourceType === 'gallery' ? 
                                __('Show images from posts in selected galleries', 'gallery-block') : 
                                __('Show featured images from posts in selected category', 'gallery-block')
                            }
                        />

                        {sourceType === 'gallery' ? (
                            <FormTokenField
                                label={__('Select Galleries', 'gallery-block')}
                                value={selectedGalleryNames}
                                suggestions={gallerySuggestions}
                                onChange={onGalleriesChange}
                                placeholder={isLoadingGalleries ? __('Loading galleries...', 'gallery-block') : __('Type to search galleries', 'gallery-block')}
                                help={__('Select one or more galleries to display images from', 'gallery-block')}
                            />
                        ) : (
                            <FormTokenField
                                label={__('Select Category', 'gallery-block')}
                                value={selectedCategoryNames}
                                suggestions={categorySuggestions}
                                onChange={onCategoriesChange}
                                placeholder={isLoadingCategories ? __('Loading categories...', 'gallery-block') : __('Type to search categories', 'gallery-block')}
                                help={__('Select ONE category to display featured images from', 'gallery-block')}
                                maxLength={1}
                            />
                        )}

                        <ToggleControl
                            label={__('Include Unpublished Pages', 'gallery-block')}
                            checked={includeUnpublished}
                            onChange={(value) => setAttributes({ includeUnpublished: value })}
                            help={__('Include featured images from draft, pending, and private posts/pages', 'gallery-block')}
                        />
                    </PanelBody>

                    <PanelBody title={__('Layout Settings', 'gallery-block')} initialOpen={true}>
                        <SelectControl
                            label={__('Layout', 'gallery-block')}
                            value={layout}
                            options={[
                                { label: __('Tiled (Justified Rows)', 'gallery-block'), value: 'tiled' },
                                { label: __('Grid (Uniform)', 'gallery-block'), value: 'grid' },
                                { label: __('Masonry (Waterfall)', 'gallery-block'), value: 'masonry' },
                                { label: __('Collage (Metro)', 'gallery-block'), value: 'collage' }
                            ]}
                            onChange={(value) => setAttributes({ layout: value })}
                        />

                        {(layout === 'grid' || layout === 'masonry' || layout === 'collage') && (
                            <RangeControl
                                label={__('Columns', 'gallery-block')}
                                value={columns}
                                onChange={(value) => setAttributes({ columns: value })}
                                min={1}
                                max={8}
                            />
                        )}

                        <RangeControl
                            label={__('Gutter (px)', 'gallery-block')}
                            value={gutter}
                            onChange={(value) => setAttributes({ gutter: value })}
                            min={0}
                            max={50}
                        />

                        {layout === 'tiled' && (
                            <RangeControl
                                label={__('Target Row Height (px)', 'gallery-block')}
                                value={targetHeight}
                                onChange={(value) => setAttributes({ targetHeight: value })}
                                min={100}
                                max={600}
                            />
                        )}

                        {layout === 'collage' && (
                            <ToggleControl
                                label={__('Crop Images', 'gallery-block')}
                                checked={crop}
                                onChange={(value) => setAttributes({ crop: value })}
                            />
                        )}
                    </PanelBody>

                    <PanelBody title={__('Image Settings', 'gallery-block')} initialOpen={false}>
                        <SelectControl
                            label={__('Image Size', 'gallery-block')}
                            value={size}
                            options={[
                                { label: __('Thumbnail', 'gallery-block'), value: 'thumbnail' },
                                { label: __('Medium', 'gallery-block'), value: 'medium' },
                                { label: __('Medium Large', 'gallery-block'), value: 'medium_large' },
                                { label: __('Large', 'gallery-block'), value: 'large' },
                                { label: __('Full Size', 'gallery-block'), value: 'full' }
                            ]}
                            onChange={(value) => setAttributes({ size: value })}
                        />

                        <RangeControl
                            label={__('Maximum Images', 'gallery-block')}
                            value={maxImages}
                            onChange={(value) => setAttributes({ maxImages: value })}
                            min={0}
                            max={100}
                            help={maxImages === 0 ? 
                                __('0 = Show all images', 'gallery-block') : 
                                __('Limit number of images displayed', 'gallery-block')
                            }
                        />
                    </PanelBody>

                    <PanelBody title={__('Features', 'gallery-block')} initialOpen={false}>
                        <ToggleControl
                            label={__('Link to Image', 'gallery-block')}
                            checked={linkToImage}
                            onChange={(value) => setAttributes({ linkToImage: value })}
                            help={__('Show "Image" link in click menu to view full-size image', 'gallery-block')}
                        />
                        <ToggleControl
                            label={__('Link to Post', 'gallery-block')}
                            checked={linkToPost}
                            onChange={(value) => setAttributes({ linkToPost: value })}
                            help={__('Show "Post" link in click menu to view the post', 'gallery-block')}
                        />
                        {!linkToImage && !linkToPost && (
                            <p style={{ fontSize: '12px', color: '#d63638', marginTop: '8px' }}>
                                {__('⚠️ At least one link option should be enabled', 'gallery-block')}
                            </p>
                        )}
                    </PanelBody>

                    <PanelBody title={__('EXIF Caption Template', 'gallery-block')} initialOpen={false}>
                        <TextControl
                            label={__('Template', 'gallery-block')}
                            value={exifTemplate}
                            onChange={(value) => setAttributes({ exifTemplate: value })}
                        />
                        <p style={{ fontSize: '12px', color: '#757575', marginTop: '8px', marginBottom: '4px' }}>
                            {__('Available placeholders:', 'gallery-block')}<br />
                            <code style={{ fontSize: '11px' }}>
                                {'{FileName}, {Copyright}, {CameraMake}, {CameraModel}, {ISOSpeedRatings}, {FocalLength}, {ShutterSpeedValue}, {FNumber}'}
                            </code>
                        </p>
                        <p style={{ fontSize: '12px', color: '#757575', marginTop: '8px', fontStyle: 'italic' }}>
                            {__('Conditional text:', 'gallery-block')}<br />
                            {__('Use ', 'gallery-block')}
                            <code style={{ fontSize: '11px' }}>{"{'text', Placeholder}"}</code>
                            {__(' to show text only if EXIF data exists.', 'gallery-block')}<br />
                            {__('Example: ', 'gallery-block')}
                            <code style={{ fontSize: '11px' }}>{"{'© ', Copyright}"}</code>
                            {__(' or ', 'gallery-block')}
                            <code style={{ fontSize: '11px' }}>{"{'| ', FNumber}"}</code>
                        </p>
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps}>
                    <div style={{
                        padding: '20px',
                        border: '2px dashed #ddd',
                        borderRadius: '4px',
                        backgroundColor: '#f9f9f9',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📸</div>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600' }}>
                            {__('Category Gallery', 'gallery-block')}
                        </h3>
                        <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                            {__('Source:', 'gallery-block')} <strong>{sourceType === 'gallery' ? 'Gallery Taxonomy' : 'Category'}</strong>
                        </p>
                        <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                            {__('Layout:', 'gallery-block')} <strong>{layout}</strong>
                        </p>
                        <p style={{ margin: '0', color: (sourceType === 'gallery' && galleries.length === 0) || (sourceType === 'category' && categories.length === 0) ? '#d63638' : '#666', fontSize: '14px' }}>
                            {selectionInfo}
                        </p>
                        {includeUnpublished && (
                            <p style={{ margin: '5px 0 0 0', color: '#2271b1', fontSize: '12px' }}>
                                ✓ {__('Including unpublished pages', 'gallery-block')}
                            </p>
                        )}
                    </div>
                </div>
            </>
        );
    },

    save: () => {
        // Dynamic block - no save implementation needed
        return null;
    }
});
