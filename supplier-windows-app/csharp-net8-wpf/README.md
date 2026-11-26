# Levitate3D Supplier Terminal (C# .NET 8 WPF Desktop Client)

A standalone Windows desktop application designed exclusively for foreign 3D designers and fulfillment operators.

## Security & Isolation
- **Zero Web Access:** Operates strictly against the scoped `/api/v1/supplier/*` backend namespace.
- **Data Stripping:** All customer pricing, profit margins, and personal identifiable information (PII) are completely excluded from payloads.
- **Device-Bound Authentication:** Authenticates with device-bound token / hardware identifier.
- **WORM Chain of Custody:** Uploads and status changes are automatically cryptographically hashed and committed to the WORM ledger.

## Build Instructions (Compile Standalone `.exe`)

### Requirements
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Windows 10/11 x64

### 1. Restore & Build
```powershell
cd supplier-windows-app/csharp-net8-wpf
dotnet restore
dotnet build -c Release
```

### 2. Publish Standalone Single-File `.exe`
To compile a single, zero-dependency executable that runs on any Windows machine without requiring .NET pre-installed:
```powershell
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o ./publish
```

The resulting `Levitate3D.Supplier.exe` in `./publish/` is ready for direct deployment to supplier workstations.
