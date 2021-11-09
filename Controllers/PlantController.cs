using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Globalization;
using System.IO;
using System.Linq;
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


    [RoutePrefix("api/plant")]
    public class PlantController : ApiController
    {
        // http://localhost:60977/api/plant?zoom=2&centerX=600&centerY=600

        [HttpGet]
        [Route("map")]
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

        private Image ResizeImage(Image originalImage, int newWidth, int newHeight)
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

                if (origX + dWidth > oWidth)
                {
                    origX = oWidth - dWidth ;
                }
                if (origY + dHeight > oHeight)
                {
                    origY = oHeight - dHeight;
                }

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

        [HttpGet]
        [Route("MapInfo")]
        public ImageInfo getMapInfo()
        {
            Image image1 = Image.FromFile(HttpRuntime.AppDomainAppPath + @"\Maps\Administration Bldg Main-Floor1.jpg");
            return new ImageInfo
            {
                Height = image1.Width,
                Width = image1.Height
            };

        }

        [HttpGet]
        [Route("Devices/{type}/{width}/{height}/{centerX}/{centerY}/{zoom}")]
        public FeatureCollection getDevices(int type, int width = 0, int height = 0, decimal centerX = 0, decimal centerY = 0, decimal zoom = 0)
        {
            ImageInfo imgInfo = getMapInfo();

            List<Feature> l = new List<Feature>();
            var res = new FeatureCollection();
            res.type = "FeatureCollection";
            Feature f1 = new Feature();
            f1.type = "Feature";
            f1.geometry = new FeatureGeometry()
            {
                coordinates = new List<int>() {
                    600, 350
                },
                type = "Feature"
            };
            f1.properties = new FeatureProperty()
            {
                tipo = 1,
                url = getImageUrl("luce")
            };
            l.Add(f1);

            Feature f2 = new Feature();
            f2.type = "Feature";
            f2.geometry = new FeatureGeometry()
            {
                coordinates = new List<int>() {
                    800, 450
                },
                type = "Feature"
            };
            f2.properties = new FeatureProperty()
            {
                tipo = 2,
                url = getImageUrl("antincendio")
            };
            l.Add(f2);


            Feature f3 = new Feature();
            f3.type = "Feature";
            f3.geometry = new FeatureGeometry()
            {
                coordinates = new List<int>() {
                    400, 250
                },
                type = "Feature"
            };
            f3.properties = new FeatureProperty()
            {
                tipo = 3,
                url = getImageUrl("antincendio")
            };
            l.Add(f3);
            var filtered = l.Where(i => i.properties.tipo == type);

            res.features = filtered.ToList();
            if (zoom > 1)
            {
                res.features = GetImageBox(res.features, centerX, centerY, zoom);
            }
            return res;
        }

        List<Feature> GetImageBox(List<Feature> l, decimal centerX = 0, decimal centerY = 0, decimal zoom = 0)
        {
            var dimensions = getMapInfo();
            int oWidth = dimensions.Width;
            int oHeight = dimensions.Height;
            decimal dWidth = dimensions.Width * zoom;
            decimal dHeight = dimensions.Height * zoom;

            // Draw the desired area of the original into the graphics object
            var origX = (int)((oWidth / 2) - (dWidth / 2)) - centerX;
            var origY = (int)((oHeight / 2) - (dHeight / 2)) + centerY;

            if (origX + dWidth > oWidth)
            {
                origX = oWidth - origX - dWidth;
            }
            if (origY + dHeight > oHeight)
            {
                origY = oHeight - origY - dHeight;
            }

            if (origX < 0) origX = 0;
            if (origY < 0) origY = 0;

            var res = l.Where(f => f.geometry.coordinates[0] > origX
                && f.geometry.coordinates[0] < origX + dimensions.Width
                && f.geometry.coordinates[1] > origY
                && f.geometry.coordinates[1] < origY + dimensions.Height).ToList();

            res.ForEach(x =>
            {
                x.geometry.coordinates[0] += (int)centerX;
                x.geometry.coordinates[1] += (int)centerY;
            });

            return res;

        }

        string getImageUrl(string name)
        {
            return $"webapp/src/assets/images/VectornMap/{name}.png";
        }



    }
}

public class ImageInfo
{
    [JsonProperty("width")]
    public int Width { get; set; }
    [JsonProperty("height")]
    public int Height { get; set; }
}

public class FeatureCollection
{
    public string type { get; set; }
    public List<Feature> features { get; set; }
}

public class Feature
{
    public string type { get; set; }
    public FeatureProperty properties { get; set; }
    public FeatureGeometry geometry { get; set; }
}

public class FeatureProperty
{
    public int tipo { get; set; }
    public string url { get; set; }
}

public class FeatureGeometry
{
    public string type { get; set; }
    public List<int> coordinates { get; set; }
}

