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

registerBlockType('category-gallery/block', {
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
                    <PanelBody title={__('Source Selection', 'category-gallery-block')} initialOpen={true}>
                        <RadioControl
                            label={__('Image Source', 'category-gallery-block')}
                            selected={sourceType}
                            options={[
                                { label: __('Gallery Taxonomy', 'category-gallery-block'), value: 'gallery' },
                                { label: __('Category', 'category-gallery-block'), value: 'category' }
                            ]}
                            onChange={onSourceTypeChange}
                            help={sourceType === 'gallery' ? 
                                __('Show images from posts in selected galleries', 'category-gallery-block') : 
                                __('Show featured images from posts in selected category', 'category-gallery-block')
                            }
                        />

                        {sourceType === 'gallery' ? (
                            <FormTokenField
                                label={__('Select Galleries', 'category-gallery-block')}
                                value={selectedGalleryNames}
                                suggestions={gallerySuggestions}
                                onChange={onGalleriesChange}
                                placeholder={isLoadingGalleries ? __('Loading galleries...', 'category-gallery-block') : __('Type to search galleries', 'category-gallery-block')}
                                help={__('Select one or more galleries to display images from', 'category-gallery-block')}
                            />
                        ) : (
                            <FormTokenField
                                label={__('Select Category', 'category-gallery-block')}
                                value={selectedCategoryNames}
                                suggestions={categorySuggestions}
                                onChange={onCategoriesChange}
                                placeholder={isLoadingCategories ? __('Loading categories...', 'category-gallery-block') : __('Type to search categories', 'category-gallery-block')}
                                help={__('Select ONE category to display featured images from', 'category-gallery-block')}
                                maxLength={1}
                            />
                        )}

                        <ToggleControl
                            label={__('Include Unpublished Pages', 'category-gallery-block')}
                            checked={includeUnpublished}
                            onChange={(value) => setAttributes({ includeUnpublished: value })}
                            help={__('Include featured images from draft, pending, and private posts/pages', 'category-gallery-block')}
                        />
                    </PanelBody>

                    <PanelBody title={__('Layout Settings', 'category-gallery-block')} initialOpen={true}>
                        <SelectControl
                            label={__('Layout', 'category-gallery-block')}
                            value={layout}
                            options={[
                                { label: __('Tiled (Justified Rows)', 'category-gallery-block'), value: 'tiled' },
                                { label: __('Grid (Uniform)', 'category-gallery-block'), value: 'grid' },
                                { label: __('Masonry (Waterfall)', 'category-gallery-block'), value: 'masonry' },
                                { label: __('Collage (Metro)', 'category-gallery-block'), value: 'collage' }
                            ]}
                            onChange={(value) => setAttributes({ layout: value })}
                        />

                        {(layout === 'grid' || layout === 'masonry' || layout === 'collage') && (
                            <RangeControl
                                label={__('Columns', 'category-gallery-block')}
                                value={columns}
                                onChange={(value) => setAttributes({ columns: value })}
                                min={1}
                                max={8}
                            />
                        )}

                        <RangeControl
                            label={__('Gutter (px)', 'category-gallery-block')}
                            value={gutter}
                            onChange={(value) => setAttributes({ gutter: value })}
                            min={0}
                            max={50}
                        />

                        {layout === 'tiled' && (
                            <RangeControl
                                label={__('Target Row Height (px)', 'category-gallery-block')}
                                value={targetHeight}
                                onChange={(value) => setAttributes({ targetHeight: value })}
                                min={100}
                                max={600}
                            />
                        )}

                        {layout === 'collage' && (
                            <ToggleControl
                                label={__('Crop Images', 'category-gallery-block')}
                                checked={crop}
                                onChange={(value) => setAttributes({ crop: value })}
                            />
                        )}
                    </PanelBody>

                    <PanelBody title={__('Image Settings', 'category-gallery-block')} initialOpen={false}>
                        <SelectControl
                            label={__('Image Size', 'category-gallery-block')}
                            value={size}
                            options={[
                                { label: __('Thumbnail', 'category-gallery-block'), value: 'thumbnail' },
                                { label: __('Medium', 'category-gallery-block'), value: 'medium' },
                                { label: __('Medium Large', 'category-gallery-block'), value: 'medium_large' },
                                { label: __('Large', 'category-gallery-block'), value: 'large' },
                                { label: __('Full Size', 'category-gallery-block'), value: 'full' }
                            ]}
                            onChange={(value) => setAttributes({ size: value })}
                        />

                        <RangeControl
                            label={__('Maximum Images', 'category-gallery-block')}
                            value={maxImages}
                            onChange={(value) => setAttributes({ maxImages: value })}
                            min={0}
                            max={100}
                            help={maxImages === 0 ? 
                                __('0 = Show all images', 'category-gallery-block') : 
                                __('Limit number of images displayed', 'category-gallery-block')
                            }
                        />
                    </PanelBody>

                    <PanelBody title={__('Features', 'category-gallery-block')} initialOpen={false}>
                        <ToggleControl
                            label={__('Link to Image', 'category-gallery-block')}
                            checked={linkToImage}
                            onChange={(value) => setAttributes({ linkToImage: value })}
                            help={__('Show "Image" link in click menu to view full-size image', 'category-gallery-block')}
                        />
                        <ToggleControl
                            label={__('Link to Post', 'category-gallery-block')}
                            checked={linkToPost}
                            onChange={(value) => setAttributes({ linkToPost: value })}
                            help={__('Show "Post" link in click menu to view the post', 'category-gallery-block')}
                        />
                        {!linkToImage && !linkToPost && (
                            <p style={{ fontSize: '12px', color: '#d63638', marginTop: '8px' }}>
                                {__('⚠️ At least one link option should be enabled', 'category-gallery-block')}
                            </p>
                        )}
                    </PanelBody>

                    <PanelBody title={__('EXIF Caption Template', 'category-gallery-block')} initialOpen={false}>
                        <TextControl
                            label={__('Template', 'category-gallery-block')}
                            value={exifTemplate}
                            onChange={(value) => setAttributes({ exifTemplate: value })}
                        />
                        <p style={{ fontSize: '12px', color: '#757575', marginTop: '8px', marginBottom: '4px' }}>
                            {__('Available placeholders:', 'category-gallery-block')}<br />
                            <code style={{ fontSize: '11px' }}>
                                {'{FileName}, {Copyright}, {CameraMake}, {CameraModel}, {ISOSpeedRatings}, {FocalLength}, {ShutterSpeedValue}, {FNumber}'}
                            </code>
                        </p>
                        <p style={{ fontSize: '12px', color: '#757575', marginTop: '8px', fontStyle: 'italic' }}>
                            {__('Conditional text:', 'category-gallery-block')}<br />
                            {__('Use ', 'category-gallery-block')}
                            <code style={{ fontSize: '11px' }}>{"{'text', Placeholder}"}</code>
                            {__(' to show text only if EXIF data exists.', 'category-gallery-block')}<br />
                            {__('Example: ', 'category-gallery-block')}
                            <code style={{ fontSize: '11px' }}>{"{'© ', Copyright}"}</code>
                            {__(' or ', 'category-gallery-block')}
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
                            {__('Category Gallery', 'category-gallery-block')}
                        </h3>
                        <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                            {__('Source:', 'category-gallery-block')} <strong>{sourceType === 'gallery' ? 'Gallery Taxonomy' : 'Category'}</strong>
                        </p>
                        <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                            {__('Layout:', 'category-gallery-block')} <strong>{layout}</strong>
                        </p>
                        <p style={{ margin: '0', color: (sourceType === 'gallery' && galleries.length === 0) || (sourceType === 'category' && categories.length === 0) ? '#d63638' : '#666', fontSize: '14px' }}>
                            {selectionInfo}
                        </p>
                        {includeUnpublished && (
                            <p style={{ margin: '5px 0 0 0', color: '#2271b1', fontSize: '12px' }}>
                                ✓ {__('Including unpublished pages', 'category-gallery-block')}
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
