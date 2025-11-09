using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.Users.DTOs;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.Users;

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserRepository _repo;
    private readonly ILogger<UserService> _logger;

    public UserService(IUserRepository repo, IUnitOfWork unitOfWork, ILogger<UserService> logger)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<UserDto> ToggleAsync(UserId id)
    {
        _logger.LogInformation("Toggling user status with ID: {Id}", id.Value);
        var user = await _repo.GetByIdAsync(id);

        if (user == null)
        {
            _logger.LogWarning("User with ID: {Id} not found.", id.Value);
            throw new BusinessRuleValidationException($"User with ID: {id.Value} not found");
        }

        _logger.LogInformation("User with ID: {Id} found.", id.Value);
        user.ToggleStatus();
        await _unitOfWork.CommitAsync();
        _logger.LogInformation("User with ID: {Id} toggled.", id.Value);

        return UserMapper.ToDto(user);
    }
    
    public async Task<UserDto> ActivateUserAsync(UserId id)
    {
        _logger.LogInformation("Activating user status with ID: {Id}", id.Value);
        var user = await _repo.GetByIdAsync(id);

        if (user == null)
        {
            _logger.LogWarning("User with ID: {Id} not found.", id.Value);
            throw new BusinessRuleValidationException($"User with ID: {id.Value} not found");
        }

        _logger.LogInformation("User with ID: {Id} found.", id.Value);
        if (!user.IsActive)
            user.ToggleStatus();
        await _unitOfWork.CommitAsync();
        _logger.LogInformation("User with ID: {Id} activated.", id.Value);

        return UserMapper.ToDto(user);
    }
    
    public async Task<UserDto> EliminateUserAsync(UserId id)
    {
        _logger.LogInformation("Eliminating user with ID: {Id}", id.Value);
        var user = await _repo.GetByIdAsync(id);

        if (user == null)
        {
            _logger.LogWarning("User with ID: {Id} not found.", id.Value);
            throw new BusinessRuleValidationException($"User with ID: {id.Value} not found");
        }

        _logger.LogInformation("User with ID: {Id} found.", id.Value);
        if (!user.Eliminated)
            user.Eliminate();
        await _unitOfWork.CommitAsync();
        _logger.LogInformation("User with ID: {Id} eliminated.", id.Value);

        return UserMapper.ToDto(user);
    }

    public async Task<UserDto> ChangeRoleAsync(UserId id, Roles newRole)
    {
        _logger.LogInformation("Changing user role with ID: {Id}", id.Value);
        var user = await _repo.GetByIdAsync(id);

        if (user == null)
        {
            _logger.LogWarning("User with ID: {Id} not found.", id.Value);
            throw new BusinessRuleValidationException($"User with ID: {id.Value} not found");
        }

        _logger.LogInformation("User with ID: {Id} found.", id.Value);
        user.UpdateRole(newRole);
        await _unitOfWork.CommitAsync();
        _logger.LogInformation("User with ID: {Id} role changed.", id.Value);

        return UserMapper.ToDto(user);
    }

    public async Task<UserDto> GetByIdAsync(UserId id)
    {
        _logger.LogInformation("Fetching user with ID: {Id}", id.Value);
        var user = await _repo.GetByIdAsync(id);

        if (user == null)
        {
            _logger.LogWarning("User with ID: {Id} not found.", id.Value);
            throw new BusinessRuleValidationException($"User with ID: {id.Value} not found");
        }

        var dto = UserMapper.ToDto(user);
        _logger.LogInformation("User with ID: {Id} found.", id.Value);
        return dto;
    }

    public async Task<UserDto> GetByEmailAsync(string email)
    {
        _logger.LogInformation("Fetching user with Email: {Email}", email);
        var user = await _repo.GetByEmailAsync(email);

        if (user == null)
        {
            _logger.LogWarning("User with Email: {Email} not found.", email);
            throw new BusinessRuleValidationException($"User with Email: {email} not found");
        }

        var dto = UserMapper.ToDto(user);
        _logger.LogInformation("User with ID: {Email} found.", email);
        return dto;
    }

    public async Task<List<UserDto>> GetAllNonAuthorizedAsync()
    {
        _logger.LogInformation("Fetching all Non Authorized Users.");
        var list = await _repo.GetAllNonAuthorizedAsync();
        var dtos = UserMapper.ToDtoList(list);
        _logger.LogInformation("Returning {Count} Non Authorized Users.", dtos.Count);
        return dtos;
    }

    public async Task<List<UserDto>> GetAllAsync()
    {
        _logger.LogInformation("Fetching all Users.");
        var list = await _repo.GetAllAsync();
        var dtos = UserMapper.ToDtoList(list);
        _logger.LogInformation("Returning {Count} Users.", dtos.Count);
        return dtos;
    }
    
    public async Task<List<UserDto>> GetAllNotEliminatedAsync()
    {
        _logger.LogInformation("Fetching all Users.");
        var list = await _repo.GetAllNotEliminatedAsync();
        var dtos = UserMapper.ToDtoList(list);
        _logger.LogInformation("Returning {Count} Users.", dtos.Count);
        return dtos;
    }

    public async Task<UserDto> AddAsync(CreatingUserDto userDto)
    {
        _logger.LogInformation("Adding user status with email: {Email}", userDto.Email);
        await EnsureNotRepeatedEmail(userDto.Email);
        var user = await UserFactory.CreateUser(userDto.Auth0UserId, userDto.Email, userDto.Name, userDto.Picture);
        await _repo.AddAsync(user);
        await _unitOfWork.CommitAsync();
        var resultDto = UserMapper.ToDto(user);
        _logger.LogInformation("User created with ID: {Id}", resultDto.Id);
        return resultDto;
    }

    public async Task<UserDto?> TryGetByEmailAsync(string email)
    {
        _logger.LogInformation("Fetching user (try) with Email: {Email}", email);
        var user = await _repo.GetByEmailAsync(email);
        return user == null ? null : UserMapper.ToDto(user);
    }

    private async Task EnsureNotRepeatedEmail(string email)
    {
        _logger.LogInformation("Ensuring {Email} is not already stored in database", email);
        var present = await _repo.GetByEmailAsync(email);
        if (present != null)
            throw new BusinessRuleValidationException("User already stored in database");
    }
}