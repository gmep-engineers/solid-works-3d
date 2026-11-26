using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Levitate3D.Supplier.Models;

namespace Levitate3D.Supplier.Services
{
    public class SupplierApiClient
    {
        private readonly HttpClient _http;
        private string? _token;

        public SupplierApiClient(string baseAddress = "http://localhost:4000/api/v1/supplier")
        {
            _http = new HttpClient { BaseAddress = new Uri(baseAddress) };
        }

        public async Task<bool> AuthenticateAsync(string email, string password, string deviceToken)
        {
            var payload = new { email, password, device_token = deviceToken };
            var response = await _http.PostAsJsonAsync("/api/v1/supplier/auth", payload);
            if (!response.IsSuccessStatusCode) return false;

            var json = await response.Content.ReadFromJsonAsync<JsonElement>();
            _token = json.GetProperty("access_token").GetString();
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
            return true;
        }

        public async Task<SupplierJobsResponse?> GetJobsAsync()
        {
            return await _http.GetFromJsonAsync<SupplierJobsResponse>("/api/v1/supplier/jobs");
        }

        public async Task<bool> UploadRefinedModelAsync(string jobId, string modelUrl, string notes)
        {
            var payload = new { model_url = modelUrl, notes };
            var response = await _http.PostAsJsonAsync($"/api/v1/supplier/jobs/{jobId}/upload-refined", payload);
            return response.IsSuccessStatusCode;
        }

        public async Task<bool> UpdateJobStatusAsync(string jobId, string stage, string carrier = "DHL Express", string? trackingNumber = null)
        {
            var payload = new { stage, carrier, tracking_number = trackingNumber };
            var response = await _http.PatchAsJsonAsync($"/api/v1/supplier/jobs/{jobId}/status", payload);
            return response.IsSuccessStatusCode;
        }
    }
}
