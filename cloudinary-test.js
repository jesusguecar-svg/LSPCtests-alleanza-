const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with inline credentials
cloudinary.config({
  cloud_name: 'djue5nsc1', // ← your cloud name
  api_key: '499451192845892', // ← your API key
  api_secret: 'aj7wibek4q8z-d9w5Hw96cvJlLk', // ← your API secret
});

async function testCloudinaryIntegration() {
  try {
    console.log('Starting Cloudinary integration test...\n');

    // Step 1: Upload a sample image from Cloudinary's demo domain
    console.log('📤 Uploading image...');
    const uploadResponse = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      { resource_type: 'auto' }
    );

    const publicId = uploadResponse.public_id;
    const secureUrl = uploadResponse.secure_url;

    console.log('✓ Upload successful!');
    console.log(`  Public ID: ${publicId}`);
    console.log(`  Secure URL: ${secureUrl}\n`);

    // Step 2: Get image metadata
    console.log('📋 Fetching image details...');
    const detailsResponse = await cloudinary.api.resource(publicId);

    const width = detailsResponse.width;
    const height = detailsResponse.height;
    const format = detailsResponse.format;
    const bytes = detailsResponse.bytes;

    console.log('✓ Image details retrieved!');
    console.log(`  Width: ${width}px`);
    console.log(`  Height: ${height}px`);
    console.log(`  Format: ${format}`);
    console.log(`  File Size: ${bytes} bytes\n`);

    // Step 3: Generate transformed image URL
    console.log('🎨 Generating transformed image...');
    // f_auto: automatically selects the best format for the user's browser (e.g., WebP, AVIF)
    // q_auto: automatically adjusts quality for optimal file size vs. visual quality
    const transformedUrl = cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto',
      secure: true,
    });

    console.log('✓ Transformation successful!');
    console.log(`  Original size: ${bytes} bytes`);
    console.log(`  Transformed URL: ${transformedUrl}\n`);

    console.log('✅ Done! Click the link below to see the optimized version of the image.');
    console.log(`${transformedUrl}\n`);
    console.log(
      'Check the transformed image size and format compared to the original.'
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testCloudinaryIntegration();
