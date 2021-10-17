using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Globalization;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web;
using System.Web.Http;

namespace BMap.Web.Controllers
{
    public class CropParams
    {
        int centerX { get; set; }
        int centerY { get; set; }
        int zoom { get; set; }
    }
    public class PlantController : ApiController
    {
        // http://localhost:60977/api/plant?zoom=2&centerX=600&centerY=600
        // GET api/values
        public HttpResponseMessage Get()
        {
            int? centerX = null;
            int? centerY = null;
            decimal? zoom = 1;
            Image image1 = Image.FromFile(HttpRuntime.AppDomainAppPath + @"\Maps\Administration Bldg Main-Floor1.jpg");

            int oWidth = image1.Width;
            int oHeight = image1.Height;

            var context = HttpContext.Current;
            zoom = context.Request.QueryString["zoom"] != null ? Convert.ToDecimal(context.Request.QueryString["zoom"], new CultureInfo("en-US")) : null as decimal?;
            context.Response.ContentType = "image/jpeg";
            if (zoom.HasValue && zoom.Value > 1)
            {
                image1 = ResizeImage(image1, (int)(image1.Width * zoom.Value), (int)(image1.Height * zoom.Value));
            }

            string centerXStr = context.Request.QueryString["centerX"];
            string centerYStr = context.Request.QueryString["centerY"];
            if (centerXStr != null && centerXStr.Contains("e")) centerXStr = "0";
            if (centerYStr != null && centerYStr.Contains("e")) centerYStr = "0";
            centerX = centerXStr != null ? (int)Convert.ToDecimal(centerXStr, new CultureInfo("en-US")) : null as int?;
            centerY = centerYStr != null ? (int)Convert.ToDecimal(centerYStr, new CultureInfo("en-US")) : null as int?;
            if (centerX.HasValue && centerY.HasValue && zoom.Value > 1)
            {
                image1 = cropToSquare(image1, oWidth, oHeight, centerX.Value, centerY.Value, zoom.Value);
            }
            using (var memoryStream = new MemoryStream())
            {
                image1.Save(memoryStream, ImageFormat.Jpeg);
                byte[] imageBytes = memoryStream.ToArray();
                string base64String = Convert.ToBase64String(imageBytes);

                var result = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent(imageBytes)
                };
                result.Content.Headers.ContentDisposition =
                    new System.Net.Http.Headers.ContentDispositionHeaderValue("attachment")
                    {
                        FileName = "plant.jpg"
                    };
                result.Content.Headers.ContentType =
                    new MediaTypeHeaderValue("image/jpg");

                return result;

            }
        }

        public Image ResizeImage(Image originalImage, int newWidth, int newHeight)
        {
            Image.GetThumbnailImageAbort abort = new Image.GetThumbnailImageAbort(ThumbnailCallback);
            //Image resizedImage = originalImage.GetThumbnailImage(newWidth, newHeight, abort, System.IntPtr.Zero);

            //return resizedImage;


            Image img = null;
            Image scaledImg = null;

            using (var ms = new MemoryStream())
            {
                try
                {
                    originalImage.Save(ms, originalImage.RawFormat);
                    using (MemoryStream stream = new MemoryStream(ms.ToArray()))
                    {
                        img = Image.FromStream(stream);
                        scaledImg = img.GetThumbnailImage(newWidth, newHeight, abort, IntPtr.Zero);
                        return scaledImg;
                    }
                }
                catch (Exception ex)
                {
                    return originalImage;
                }
            }
        }

        private Image cropToSquare(Image originalImage, int dWidth, int dHeight, int centerX, int centerY, decimal zoom)
        {
            //Location of 320x240 image
            Bitmap cropped = new Bitmap(dWidth, dHeight);
            int oWidth = originalImage.Width;
            int oHeight = originalImage.Height;

            //Load image from file
            // Create a Graphics object to do the drawing, *with the new bitmap as the target*
            using (Graphics g = Graphics.FromImage(cropped))
            {
                // Draw the desired area of the original into the graphics object
                var origX = (int)((oWidth / 2) - (dWidth / 2)) - centerX;
                var origY = (int)((oHeight / 2) - (dHeight / 2)) + centerY;

                if (origX + dWidth > oWidth) origX = oWidth - origX - dWidth;
                if (origY + dHeight > oHeight) origY = oHeight - origY - dHeight;

                if (origX < 0) origX = 0;
                if (origY < 0) origY = 0;



                g.DrawImage(originalImage, new Rectangle(0, 0, dWidth, dHeight), new Rectangle(origX, origY, dWidth, dHeight), GraphicsUnit.Pixel);
                return cropped;
            }

        }

        private bool ThumbnailCallback()
        {
            return false;
        }
    }
}
