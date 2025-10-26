using SEM5_PI_WEBAPI.Domain.Dock.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Domain.Dock
{
    public static class DockFactory
    {
        public static EntityDock RegisterDock(RegisterDockDto dto, List<PhysicalResourceCode> prc)
        {
            
            return new EntityDock(
                new DockCode(dto.Code),
                prc,
                dto.Location,
                dto.LengthM,
                dto.DepthM,
                dto.MaxDraftM,
                dto.VesselsTypesObjs,
                DockStatus.Available
            );
        }
    }
}