namespace ColorMixer.Models;

public static class PaintDatabase
{
    public static List<PaintBrand> Brands { get; } = new()
    {
        new PaintBrand
        {
            Name = "Vallejo",
            Colors = new List<PaintColor>
            {
                new() { Name = "Dead White",       Hex = "#F5F5F5" },
                new() { Name = "Ivory",            Hex = "#F5F0DC" },
                new() { Name = "Lemon Yellow",     Hex = "#FFF44F" },
                new() { Name = "Sun Yellow",       Hex = "#FFC200" },
                new() { Name = "Deep Yellow",      Hex = "#FFB300" },
                new() { Name = "Orange",           Hex = "#FF6B1A" },
                new() { Name = "Vermillion",       Hex = "#E34234" },
                new() { Name = "Scarlet",          Hex = "#FF2400" },
                new() { Name = "Carmine Red",      Hex = "#960018" },
                new() { Name = "Rose",             Hex = "#FF66CC" },
                new() { Name = "Magenta",          Hex = "#CF1C8B" },
                new() { Name = "Violet",           Hex = "#7F00FF" },
                new() { Name = "Royal Purple",     Hex = "#4B0082" },
                new() { Name = "Ultramarine",      Hex = "#3F00FF" },
                new() { Name = "Prussian Blue",    Hex = "#003153" },
                new() { Name = "Dark Prussian",    Hex = "#00222E" },
                new() { Name = "Azure",            Hex = "#0080FF" },
                new() { Name = "Sky Blue",         Hex = "#87CEEB" },
                new() { Name = "Electric Blue",    Hex = "#7DF9FF" },
                new() { Name = "Turquoise",        Hex = "#00CED1" },
                new() { Name = "Intermediate Grn", Hex = "#007940" },
                new() { Name = "Emerald",          Hex = "#50C878" },
                new() { Name = "Lime Green",       Hex = "#32CD32" },
                new() { Name = "Yellow Green",     Hex = "#9ACD32" },
                new() { Name = "Khaki",            Hex = "#C3B091" },
                new() { Name = "Raw Sienna",       Hex = "#C68642" },
                new() { Name = "Burnt Sienna",     Hex = "#8B4513" },
                new() { Name = "Chocolate Brown",  Hex = "#3D1C02" },
                new() { Name = "Neutral Grey",     Hex = "#8B8B8B" },
                new() { Name = "Black",            Hex = "#0D0D0D" },
            }
        },

        new PaintBrand
        {
            Name = "Citadel",
            Colors = new List<PaintColor>
            {
                new() { Name = "White Scar",       Hex = "#F8F8F8" },
                new() { Name = "Flash Gitz Yellow",Hex = "#FFE01B" },
                new() { Name = "Yriel Yellow",     Hex = "#FFBD00" },
                new() { Name = "Troll Slayer Org", Hex = "#FF4F00" },
                new() { Name = "Evil Sunz Scarlet",Hex = "#C60000" },
                new() { Name = "Wild Rider Red",   Hex = "#E52B21" },
                new() { Name = "Mephiston Red",    Hex = "#9A0A0A" },
                new() { Name = "Pink Horror",      Hex = "#E94592" },
                new() { Name = "Emperor's Child",  Hex = "#ED4090" },
                new() { Name = "Screamer Pink",    Hex = "#8C1551" },
                new() { Name = "Xereus Purple",    Hex = "#5C0078" },
                new() { Name = "Daemonette Hide",  Hex = "#735980" },
                new() { Name = "Kantor Blue",      Hex = "#010F5A" },
                new() { Name = "Macragge Blue",    Hex = "#1A3BB3" },
                new() { Name = "Caledor Sky",      Hex = "#2B6FB3" },
                new() { Name = "Teclis Blue",      Hex = "#2D71B8" },
                new() { Name = "Lothern Blue",     Hex = "#3C8AC4" },
                new() { Name = "Sotek Green",      Hex = "#1E7661" },
                new() { Name = "Temple Guard Blue",Hex = "#2D9C87" },
                new() { Name = "Moot Green",       Hex = "#1EC500" },
                new() { Name = "Warpstone Glow",   Hex = "#10A030" },
                new() { Name = "Straken Green",    Hex = "#4D6B2A" },
                new() { Name = "Averland Sunset",  Hex = "#E9A024" },
                new() { Name = "Zandri Dust",      Hex = "#A89060" },
                new() { Name = "XV-88",            Hex = "#7A5C34" },
                new() { Name = "Rhinox Hide",      Hex = "#422318" },
                new() { Name = "Doombull Brown",   Hex = "#682012" },
                new() { Name = "Mechanicus Grey",  Hex = "#545454" },
                new() { Name = "Eshin Grey",       Hex = "#3A3A40" },
                new() { Name = "Abaddon Black",    Hex = "#070707" },
            }
        },

        new PaintBrand
        {
            Name = "Liquitex",
            Colors = new List<PaintColor>
            {
                new() { Name = "Titanium White",   Hex = "#FEFEFE" },
                new() { Name = "Zinc White",       Hex = "#E8E8E8" },
                new() { Name = "Hansa Yellow Lt",  Hex = "#FFEC6E" },
                new() { Name = "Hansa Yellow Md",  Hex = "#F7C600" },
                new() { Name = "Cadmium Yellow Md",Hex = "#FFA400" },
                new() { Name = "Cadmium Orange",   Hex = "#FF4E00" },
                new() { Name = "Cadmium Red Md",   Hex = "#D61D12" },
                new() { Name = "Naphthol Crimson", Hex = "#B90022" },
                new() { Name = "Quinacridone Red", Hex = "#E91060" },
                new() { Name = "Quinacridone Mag", Hex = "#CC2060" },
                new() { Name = "Dioxazine Purple", Hex = "#3B0760" },
                new() { Name = "Prism Violet",     Hex = "#5B1F8A" },
                new() { Name = "Cobalt Blue",      Hex = "#0047AB" },
                new() { Name = "Ultramarine Blue", Hex = "#1F31AE" },
                new() { Name = "Manganese Blue",   Hex = "#2A75C0" },
                new() { Name = "Cerulean Blue",    Hex = "#2A52BE" },
                new() { Name = "Phthalocya. Blue", Hex = "#000F89" },
                new() { Name = "Phthalocya. Green",Hex = "#00A896" },
                new() { Name = "Viridian",         Hex = "#40826D" },
                new() { Name = "Hooker's Green",   Hex = "#1B4D3E" },
                new() { Name = "Sap Green",        Hex = "#4A7C59" },
                new() { Name = "Yellow Oxide",     Hex = "#C8900A" },
                new() { Name = "Raw Sienna",       Hex = "#C68642" },
                new() { Name = "Burnt Sienna",     Hex = "#8B4513" },
                new() { Name = "Raw Umber",        Hex = "#826644" },
                new() { Name = "Burnt Umber",      Hex = "#5C3317" },
                new() { Name = "Mars Black",       Hex = "#181818" },
                new() { Name = "Ivory Black",      Hex = "#231F1F" },
                new() { Name = "Neutral Gray #5",  Hex = "#7D7D7D" },
                new() { Name = "Payne's Gray",     Hex = "#40404F" },
            }
        }
    };
}
